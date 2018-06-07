// ==UserScript==
// @name         Search Form
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New landing page search form
// @author       Jason Bressler
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js
// @require      https://raw.githubusercontent.com/bressljr/searchform/master/selecty.js
// @resource     customcss https://raw.githubusercontent.com/bressljr/searchform/master/styles.css?v=5
// @resource     selectycss https://raw.githubusercontent.com/bressljr/searchform/master/selecty.css?v=1
// @resource     juriscss https://raw.githubusercontent.com/bressljr/searchform/master/hummingbird-treeview.css?v=3
// @resource     jurishtml https://raw.githubusercontent.com/bressljr/searchform/master/juris.html?v=4
// @match        https://advance.lexis.com/usresearchhome/*
// @match        https://advance.lexis.com/firsttime*
// @match        https://advance.lexis.com/search*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==


(function() {
    'use strict';

    waitForKeyElements(".content-switcher-list", switchHLCT, true);
    waitForKeyElements(".ct-landing-wrapper", runMain, true);

    function runMain() {

        var customCSS = GM_getResourceText ("customcss"),
        selectyCSS = GM_getResourceText ("selectycss"),
        jurisCSS = GM_getResourceText ("juriscss"),
        faCSS = GM_getResourceText ("fontawesome"),
        jurisHTML = GM_getResourceText ("jurishtml");

        GM_addStyle (customCSS);
        GM_addStyle (selectyCSS);
        GM_addStyle (jurisCSS);
        GM_addStyle (faCSS);


        //REMOVE UNUSED ELEMENTS
        $(".highlanderpod, .getadoc, .searchbox .options").remove();
        $(".ct-landing-wrapper").removeClass("pagewrapper");

        //Wrap search section in container (grid)
        $('.pod-wrapper.searchbox').wrap( "<div class='searchsection'><div></div></div>" );


        //INJECT HLCT, JURIS, ETC.
        $('.searchsection > div').prepend('<div class="juris prefilter"><label for="juris">within</label><div class="selecty"><a class="selecty-selected"><i>All Jurisdictions and Courts</i></a></div></div>');
        $('.searchsection > div').prepend('<div class="hlct prefilter"><label for="hlct">starting in</label><select id="hlct"><option value="urn:hlct:5">Cases</option><option value="urn:hlct:15">Statutes and Legislation</option><option value="urn:hlct:3">Secondary Materials</option><option value="urn:hlct:2">Administrative Materials<option value="urn:hlct:4">Briefs, Pleadings and Motions<option value="urn:hlct:1">Administrative Codes and Regulations<option value="urn:hlct:10">Forms<option value="urn:hlct:16">News<option value="urn:hlct:14">Legal News<option value="urn:hlct:8">Dockets<option value="urn:hlct:13">Jury Verdicts and Settlements<option value="urn:hlct:12">Jury Instructions<option value="urn:hlct:9">Expert Witness Materials<option value="urn:hlct:6">Company and Financial<option value="urn:hlct:7">Directories<option value="urn:hlct:18">Scientific<option value="urn:hlct:11">Intellectual Property</select></div>');

        $('.searchsection > div').append('<div class="appliedfilters"><span>Narrow by:</span></div>');

        //INJECT MORE OPTIONS
        $('.searchsection > div')
            .append('<div class="divider moreopts"></div>')
            .append('<div class="prefilter moreopts pat"><label for="pat">practice areas</label><select multiple id="pat"><option>All Practice Areas</option></select></div>')
            .append('<div class="prefilter moreopts favs"><label for="favs">recent / favorites</label><select id="favs"><option>Select Recent or Favorite</option></select></div>')
            .append('<div id="datefilters" class="moreopts"><button type="button" value="Previous Year">within 1 year</button><button type="button" value="Previous 5 Years">within 5 years</button><button type="button" value="Previous 10 Years">within 10 years</button></div>')
            .append('<div class="moreoptions"><button type="button"></button></div>')
            .prepend('<h2 class="sectionheader">Search</h2>');

       $("#searchTerms").attr("placeholder","Enter Search Terms, Keywords, Citation, or shep: to Shepardize®");

       $('#hlct option[value="'+GM_getValue("hlct")+'"]').attr("selected","selected");
       $(".juris .selecty").append(jurisHTML);

       $(".hummingbird-treeview input:checkbox").click(function() {
           var attr = $(this).attr('data-value');
           $("input[data-id='"+attr+"']").click();
           if($(this).is(":checked")) {
              if (typeof attr !== typeof undefined && attr !== false) {
               //add top filter
                  $(".juris .selecty-selected").append("<span class='jurisfilter' data-id='"+attr+"'>"+$(this).data("id")+"<span class='icon la-CloseRemove'></span></span>").find("i").hide();
              } else {
                  //alert($(this).closest("input:checkbox[data-value=*'jur']").data("value"));
               //above and swap out i
               //bubble up and add filter
              }
           } else {
               $(".juris .selecty-selected").find("span[data-id='"+attr+"']").remove();
               $(".juris .selecty-selected").find("span").length || $(".juris .selecty-selected").find("i").show();
           }
       });

       waitForKeyElements(".ssat-filters", loadpat, true);
       waitForKeyElements(".recent-favorites-filters", loadfavs, true);

       var hlctfilter = new selecty(document.getElementById('hlct'));


        $('.pod-wrapper.browse')
            .wrap( "<div class='exploresection'></div>" )
            .prepend('<h2 class="sectionheader">Explore</h2>');


        //INITIALIZE FILTERS BASED ON PREVIOUS SELECTIONS - BROWSER STORAGE


        $('.moreoptions > button').click(function() {
            $(".searchsection > div").toggleClass("showopts");
            GM_setValue("moreopts",$(".searchsection > div").attr("class"));
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

        $(document).on("click",".prefilter > label, .prefilter .selecty-selected",function(e) {
            if($(this).closest(".juris").length) {
                $('#juris-tree').toggle();
            } else {
                e.preventDefault();
                $(this).parent(".prefilter").find(".selecty-selected")[0].click();
            }
        });

        $(document).mouseup(function(e) {
            var container = $("#juris-tree");
            if($(e.target).closest(".juris").length === 0)
            {
                container.hide();
            }
        });


        $('#datefilters > button').click(function() {
            var alreadyActive = $(this).hasClass("active");
            $('#datefilters > button').removeClass('active');

            if(alreadyActive) {
               GM_deleteValue("date");
               $(".deleteFilter[data-id='date']").click();
            } else {
               $(this).addClass("active");
               GM_setValue("date",$(this).val());
               setDate($(this).val());
            }
        });

    }
/*
    function applyPATFilters() {
          $(".ssat-filters input:checkbox").click();
          $( "#pat option:selected" ).each(function() {
            $("*[data-id='"+$(this).val()+"']").click();
          });
    }
    */

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

        //Move to function
        $('#mainSearch').click(function(e) {
            GM_setValue("hlct", $( "#hlct option:selected" ).val());
        });

        $('#datefilters > button[value="' + GM_getValue("date") + '"]').addClass("active");


    }

    function loadfavs() {
        var favdropdown = $("#favs");

        $("label[data-popupid='recentFavoriteRow']").each(function() {
            favdropdown.append($("<option>").attr('value',$(this).attr("for")).text($(this).text()));
        });
        var favfilter = new selecty(document.getElementById('favs'));

        $(".searchsection > div").addClass(GM_getValue("moreopts"));
    }

    function switchHLCT() {
        $(".content-switcher-list").find("li[data-id='"+GM_getValue("hlct")+"']:not(.active) button").click();

        $(document).on("click",".content-switcher-list li",function() {
            GM_setValue("hlct",$(this).data("id"));
        });
    }

})();