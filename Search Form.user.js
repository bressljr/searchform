// ==UserScript==
// @name         Search Form
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New landing page search form
// @author       Jason Bressler
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js
// @require      https://raw.githubusercontent.com/bressljr/searchform/master/selecty.js
// @resource     customcss https://raw.githubusercontent.com/bressljr/searchform/master/styles.css?v=1
// @resource     selectycss https://raw.githubusercontent.com/bressljr/searchform/master/selecty.css
// @match        https://advance.lexis.com/usresearchhome/*
// @match        https://advance.lexis.com/firsttime*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    var customCSS = GM_getResourceText ("customcss"),
        selectyCSS = GM_getResourceText ("selectycss");

    GM_addStyle (customCSS);
    GM_addStyle (selectyCSS);


    window.addEventListener('load', function() {

        //REMOVE UNUSED ELEMENTS
        $(".highlanderpod, .getadoc, .searchbox .options").remove();
        $(".ct-landing-wrapper").removeClass("pagewrapper");

        //Wrap search section in container (grid)
        $('.pod-wrapper.searchbox').wrap( "<div class='searchsection'><div></div></div>" );


        //INJECT HLCT, JURIS, ETC.
        $('.searchsection > div').prepend('<div class="juris prefilter"><label for="juris">within</label><select multiple id="juris"><option value="">All Jurisdictions and Courts</option></select></div>');
        $('.searchsection > div').prepend('<div class="hlct prefilter"><label for="hlct">starting in</label><select id="hlct"><option>Cases<option>Statutes and Legislation<option>Secondary Materials<option>Administrative Materials<option>Briefs, Pleadings and Motions<option>Administrative Codes and Regulations<option>Forms<option>News<option>Legal News<option>Dockets<option>Jury Verdicts and Settlements<option>Jury Instructions<option>Expert Witness Materials<option>Company and Financial<option>Directories<option>Scientific<option>Intellectual Property</select></div>');

        $('.searchsection > div').append('<div class="appliedfilters"><span>Narrow by:</span></div>');

        //INJECT MORE OPTIONS
        $('.searchsection > div')
            .append('<div class="divider moreopts"></div>')
            .append('<div class="prefilter moreopts pat"><label for="pat">practice areas</label><select multiple id="pat"><option>All Practice Areas</option></select></div>')
            .append('<div class="prefilter moreopts favs"><label for="favs">recent / favorites</label><select id="favs"><option>Select Recent or Favorite</option></select></div>')
            .append('<div id="datefilters" class="moreopts"><button type="button" value="Previous Year">Within 1 year</button><button type="button" value="Previous 5 Years">within 5 years</button><button type="button" value="Previous 10 Years">within 10 years</button></div>')
            .append('<div class="moreoptions"><button type="button"></button></div>')
            .prepend('<h2 class="sectionheader">Search</h2>');

       waitForKeyElements(".ssat-filters", loadpat, true);
       waitForKeyElements(".recent-favorites-filters", loadfavs, true);

       var jurisfilter = new selecty(document.getElementById('juris')),
            hlctfilter = new selecty(document.getElementById('hlct'));


        $('.pod-wrapper.browse')
            .wrap( "<div class='exploresection'></div>" )
            .prepend('<h2 class="sectionheader">Explore</h2>');


        //INITIALIZE FILTERS BASED ON PREVIOUS SELECTIONS - BROWSER STORAGE


        $('.moreoptions > button').click(function() {
            $(".searchsection > div").toggleClass("showopts");
        });

        $(document).on("click","*[data-action='addsource']",function() {
            var sourceID = $(this).closest("li").data("value");

            if(!$(this).hasClass("sourceadded")) {
                //Remove local
                $(".appliedfilters button[data-id='"+sourceID+"']").remove();
                sourceCheck();
            } else {
                $("a.selecty-selected").html("N/A <span>(searching source)</span>");
                $(".appliedfilters").append('<button type="button" data-id="'+sourceID+'">'+$(this).closest("li").data("text")+'<span class="icon la-CloseRemove"></span></button>').show();
            }
        });



        $(document).on("click",".appliedfilters > button",function() {
            $(".deleteFilter[data-id*='"+$(this).data("id")+"']").click();
            $(this).remove();
            sourceCheck();
        });


        $('#datefilters > button').click(function() {
            var alreadyActive = $(this).hasClass("active");
            $('#datefilters > button').removeClass('active');

            if(alreadyActive) {
               $(".deleteFilter[data-id='date']").click();
            } else {
               $(this).addClass("active");
               setDate($(this).val());
            }
        });

    }, false);

    function applyPATFilters() {
          $(".ssat-filters input:checkbox").click();
          $( "#pat option:selected" ).each(function() {
            $("*[data-id='"+$(this).val()+"']").click();
          });
    }

    function sourceCheck() {
         if(!$(".appliedfilters > button").length) {
             $(".appliedfilters").hide();
             $(".selecty-options li").first().click();
             //$("a.selecty-selected").html("Blah");

         }
    }


    function setDate(datestring) {
        $('#date option').filter(function() {
            return ($(this).text() == datestring); //To select Blue
        }).prop('selected', true).trigger('change');
        $("button.adddate").trigger('click');
    }

    function loadpat() {
        var patdropdown = $("#pat");
        $(".ssat-filters input:checkbox").each(function() {
            var newOption = $("<option>").attr('value',$(this).data("id")).text($(this).data("value"));
            $(this).is(":checked") && newOption.attr("selected","selected");
            patdropdown.append(newOption);
        });
        var patfilter = new selecty(document.getElementById('pat'));


        $('.prefilter.pat li').click(function(e) {
            $("*[data-id='"+$(this).data("value")+"']").click();
            $(".pat .selecty-selected")[0].click(); //TO get focus back
        });

        //Click the recent and favorites tab to get those as well
        $("#recent-favorites").click();

        if($(".deleteFilter[data-id='date']").length) {
             var dateFilter = $(".deleteFilter[data-id='date']").text();
             //switch statement here?
        }
    }

    function loadfavs() {
        var favdropdown = $("#favs");

        $("label[data-popupid='recentFavoriteRow']").each(function() {
            favdropdown.append($("<option>").attr('value',$(this).attr("for")).text($(this).text()));
        });
        var favfilter = new selecty(document.getElementById('favs'));
    }

})();