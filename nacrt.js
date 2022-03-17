//// MAPY.CZ ////

recreateMap(18.1339652, 49.6568169);

/// naseptavani ///

var inputEl = document.querySelector("input[type='text']");
var suggest = new SMap.Suggest(inputEl);
suggest.urlParams({
	bounds: "48.5370786,12.0921668|51.0746358,18.8927040" // omezeni pro celou CR
});
suggest.addListener("suggest", function(suggestData) {
  // {"longitude":14.943372423645501,"latitude":49.63558441504358,"source":"muni","id":3537,"title":"Pravonín","secondRow":"Obec, Česko","thirdRow":"","phrase":"Pravonín","iconType":"geo","iconUrl":"","poiTypeId":203,"mmid":0,"mmsource":"","mmtype":""}
  recreateMap(suggestData.data.longitude, suggestData.data.latitude);

}).addListener("close", function() {
  console.log("suggest byl zavren/skryt");
});

/// redraw map ///
  
function recreateMap(long, lat) {
    var stred = SMap.Coords.fromWGS84(long, lat);
    var m = new SMap(JAK.gel("mapa"), stred, 20);
    m.addControl(new SMap.Control.Sync());
    m.addDefaultLayer(SMap.DEF_SMART_BASE).enable();

    var o = {title:"Posun mapy"};
    var c = new SMap.Control.Compass(o);
    m.addControl(c, {left:"8px", top:"9px"});

    $("#toolbox > .compass").remove();
    $(".compass").prependTo( $("#toolbox") );
}


//// PANELY /////

var panely = {
    AEG: { sirka: 105, vyska: 211 },
    SUN: { sirka: 100, vyska: 218 },
    SUNB: { sirka: 100, vyska: 218 },
    CS375: { sirka: 105 , vyska: 177 },
    ENG: { sirka: 104 , vyska: 178 },
};

var panel_count = 22;
var panel_vyska = 218;
var panel_sirka = 100;
var cm_ratio = 0.16;

var panel_width = cm_ratio * panel_sirka;
var panel_height = cm_ratio * panel_vyska;

// skladani //

jQuery(document).ready(function($){

    //$(".compass").prependTo( $("#toolbox") );

    // append panels //

    for (let i = 1; i < panel_count + 1; i++) {
        var panel = "<div class='panel' id='pan_"+i+"' style='width:"+panel_width+"px; height:"+panel_height+"px;'></div>";
        $("#panely").append( panel );
    }

    // make them draggable //

    $(".panel").draggable({ 
        //snap: false,
        //snapMode: "inner",
        appendTo: "#canvas",
        opacity: 0.5,
        cursor: "move",
        helper: 'clone',
        refreshPositions: true,
        revert: "invalid",
        zIndex: 1100,
        stop: function( event, ui ) {  

            if($('#canvas').find(this).length == 1) {
                $(this).css({
                    position: "absolute",
                    top: ui.position.top,
                    left: ui.position.left,
                });
            } else {
                var ostatni_deg = $( "#azimut" ).val();
                $(this).css({
                    position: "relative",
                    top: 0,
                    left: 0,
                    transform: 'rotate('+ ostatni_deg.replace("°", "") +'deg)',
                });
            }
            refresh_counter();

        }
    });

    $("#panely").droppable({
        tolerance: "intersect",
        accept: ".panel",
        activeClass: "ui-state-default",
        hoverClass: "ui-state-hover",
        drop: function(event, ui) {
            $("#panely").append($(ui.draggable));
        }
    });

    $("#canvas").droppable({
        tolerance: "intersect",
        accept: ".panel",
        activeClass: "ui-state-default",
        hoverClass: "ui-state-hover",
        drop: function(event, ui) {        
            $("#canvas").append($(ui.draggable));
        },
    });

    // panel rotator //

    $( "#rotator" ).slider({
        range: "min",
        min: 0,
        max: 360,
        value: 180,
        slide: function( event, ui ) {
          $( "#azimut" ).val( ui.value + "°" );

          $( ".panel" ).each(function() {
            if($('#panely').find(this).length == 1) {
              $(this).css({'transform' : 'rotate('+ ui.value +'deg)'});
            }  
          });
          
        }
    });

    // naklon panelu //

    const naklon_ratio = [];
    naklon_ratio[0] = 1;
    naklon_ratio[5] = 0.996;
    naklon_ratio[10] = 0.985;
    naklon_ratio[15] = 0.966;
    naklon_ratio[20] = 0.94;
    naklon_ratio[25] = 0.906;
    naklon_ratio[30] = 0.866;
    naklon_ratio[35] = 0.819;
    naklon_ratio[40] = 0.766;
    naklon_ratio[45] = 0.707;
    naklon_ratio[50] = 0.643;
    naklon_ratio[55] = 0.574;
    naklon_ratio[60] = 0.5;
    naklon_ratio[65] = 0.423;
    naklon_ratio[70] = 0.342;

    $( "#klopic" ).slider({
        range: "min",
        value: 25,
        min: 0,
        max: 70,
        step: 5,
        slide: function( event, ui ) {
            $( "#sklon" ).val( ui.value + "°" );

            $( ".panel" ).each(function() {
                if($('#panely').find(this).length == 1) {
                    if ( $( "#strana" ).is(':checked') ) {
                        $(this).css({'width' : (naklon_ratio[ui.value] * panel_width) + 'px'});
                    } else {
                        $(this).css({'height' : (naklon_ratio[ui.value] * panel_height) + 'px'});
                    }
                }  
            });
        }
    });
    $( "#sklon" ).val( $( "#klopic" ).slider( "value" )  + "°" );

    $( "#strana" ).change(function() {

        $( ".panel" ).each(function() {
            if($('#panely').find(this).length == 1) {
                if( $( "#strana" ).is(':checked') ) {
                    $(this).css({'height' : (1 * panel_height) + 'px'});
                } else {
                    $(this).css({'width' : (1 * panel_width) + 'px'});
                }
            }  
        });
    });

    // azimut finder //

    var azimut_switch = false;

    $("#azimut_switch").click(function() {
        if ( azimut_switch == false ) {
            $('body').css('cursor', 'crosshair');
            $("#azimut_switch").addClass("aktiv");
            azimut_switch = true;
        } else {
            $('body').css('cursor', 'default');
            $('.line').remove();
            $("#azimut_switch").removeClass("aktiv");
            azimut_switch = false;
        }
    });

    // line draw //
            
    var x1 = null;
    var y1 = null;
    var offsetX = 0;
    var offsetY = 0;
    var moveLineId = "moveLine";

    $('#canvas').on("mousedown", function(event) {

            $(".line").removeAttr('id');
            var x = event.pageX,
                y = event.pageY;

            if (x1 == null) {
                x1 = x;
                y1 = y;
            } else {
                x1 = y1 = null;
            }

            })
        .delegate('.line', 'mouseup', function(event) {
            // Use "mouseup" here so the start of a line is registered as soon as you release the mouse button.
            event.preventDefault();
            $(this).toggleClass('active');
            x1 = y1 = null;
            return false;
    });

    $('#canvas').mousemove(function(event) {
        if ( azimut_switch == true ) {

            var x = event.pageX,
            y = event.pageY;

            if (x1 != null) {
                $("#" + moveLineId).remove();
                createLine(x1, y1, x, y, moveLineId)
            } else {
                x1 = y1 = null;
            }
        }
    });

    function createLine(x1, y1, x2, y2, id) {

        var length = Math.sqrt(((x1 - x2) * (x1 - x2)) + ((y1 - y2) * (y1 - y2)));
        var angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        var transform = 'rotate(' + angle + 'deg)';

        $("#azimut_degree").text( Math.round( angle + 90 ) + "°" );
        $("#meter").text( Math.round( length / 16 ) + "m" );

        offsetX = (x1 > x2) ? x2 : x1;
        offsetY = (y1 > y2) ? y2 : y1;

        var line = $('<div>')
        .appendTo('#canvas')
        .addClass('line')
        .css({
            'position': 'absolute',
            '-webkit-transform': transform,
            '-moz-transform': transform,
            'transform': transform
        })
        .width(length)
        .offset({
            left: offsetX,
            top: offsetY
        });

        if (id != null) line.attr('id', id);

        return line;
    }

    
});

// refresh counter //

function refresh_counter() {
    var count = $("#canvas > .panel").length;
    $("#panel_count").text(count - 1);
}


//// save PDF ////

function getPDF(){

    html2canvas($("#saving")[0], { allowTaint:false, useCORS:true, proxy: "server.js"  } ).then(canvas => {
        var imgData = canvas.toDataURL("image/jpeg",1);
        var pdf = new jsPDF("p", "mm", "a4");
        var pageWidth = 210;
        var pageHeight = 297;
        var imageWidth = canvas.width;
        var imageHeight = canvas.height;

        var ratio = imageWidth/imageHeight >= pageWidth/pageHeight ? pageWidth/imageWidth : pageHeight/imageHeight;
        pdf.addImage(imgData, 'JPEG', 0, 0, imageWidth * ratio, imageHeight * ratio);
        pdf.save("invoice.pdf");
    });
    
};

function CreatePDFfromHTML() {
    var HTML_Width = $("#saving").width();
    var HTML_Height = $("#saving").height();
    var top_left_margin = 0;
    var PDF_Width = HTML_Width + (top_left_margin * 2);
    var PDF_Height = (PDF_Width * 1.5) + (top_left_margin * 2);
    var canvas_image_width = HTML_Width;
    var canvas_image_height = HTML_Height;

    var totalPDFPages = Math.ceil(HTML_Height / PDF_Height) - 1;

    html2canvas($("#saving")[0]).then(function (canvas) {
        var imgData = canvas.toDataURL("image/jpeg", 1.0);
        var pdf = new jsPDF('p', 'pt', [PDF_Width, PDF_Height]);
        pdf.addImage(imgData, 'JPG', top_left_margin, top_left_margin, canvas_image_width, canvas_image_height);
        for (var i = 1; i <= totalPDFPages; i++) { 
            pdf.addPage(PDF_Width, PDF_Height);
            pdf.addImage(imgData, 'JPG', top_left_margin, -(PDF_Height*i)+(top_left_margin*4),canvas_image_width,canvas_image_height);
        }
        pdf.save("Your_PDF_Name.pdf");
    });
}

$('#savepdf').click(function () {
    getPDF();
});