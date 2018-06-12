// ==UserScript==
// @name         Search Form
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  New landing page search form
// @author       Jason Bressler
// @require      https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require      https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js
// @require      https://raw.githubusercontent.com/bressljr/searchform/master/selecty.js
// @resource     customcss https://raw.githubusercontent.com/bressljr/searchform/master/styles.css?v=4
// @resource     selectycss https://raw.githubusercontent.com/bressljr/searchform/master/selecty.css?v=1
// @resource     juriscss https://raw.githubusercontent.com/bressljr/searchform/master/hummingbird-treeview.css?v=5
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

    var checksilent = true;

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
        $('.searchsection > div').prepend('<div class="juris prefilter"><label for="juris">within</label><div class="selecty"><a class="selecty-selected" data-placeholder="All Jurisdictions and Courts"><i>All Jurisdictions and Courts</i></a></div></div>');
        $('.searchsection > div').prepend('<div class="hlct prefilter"><label for="hlct">starting in</label><select id="hlct"><option value="urn:hlct:5">Cases</option><option value="urn:hlct:15">Statutes and Legislation</option><option value="urn:hlct:3">Secondary Materials</option><option value="urn:hlct:2">Administrative Materials<option value="urn:hlct:4">Briefs, Pleadings and Motions<option value="urn:hlct:1">Administrative Codes and Regulations<option value="urn:hlct:10">Forms<option value="urn:hlct:16">News<option value="urn:hlct:14">Legal News<option value="urn:hlct:8">Dockets<option value="urn:hlct:13">Jury Verdicts and Settlements<option value="urn:hlct:12">Jury Instructions<option value="urn:hlct:9">Expert Witness Materials<option value="urn:hlct:6">Company and Financial<option value="urn:hlct:7">Directories<option value="urn:hlct:18">Scientific<option value="urn:hlct:11">Intellectual Property</select></div>');

        $('.searchsection > div').append('<div class="appliedfilters"><span>Narrow by:</span></div>');
        $('.searchsection > div').append('<div class="clearlink"><a href="#" id="clearform">Clear Search Filters</a></div>');

        //INJECT MORE OPTIONS
        $('.searchsection > div')
            .append('<div class="divider moreopts"></div>')
            .append('<div class="prefilter moreopts pat"><label for="pat">practice areas</label><select multiple id="pat"><option>All Practice Areas</option></select></div>')
            .append('<div class="prefilter moreopts favs"><label for="favs">recent / favorites</label><select id="favs"><option>Select Recent or Favorite</option></select></div>')
            .append('<div id="datefilters" class="moreopts"><button type="button" value="Previous Year">within 1 year</button><button type="button" value="Previous 5 Years">within 5 years</button><button type="button" value="Previous 10 Years">within 10 years</button></div>')
            .append('<div class="moreoptions"><button type="button"></button></div>')
            .prepend('<h2 class="sectionheader">Search</h2>');


        $('#clearform').click(function() {
            $('.jurisfilter').click();
            $(".selecty-options li.selected").click();
            $("#datefilters > button.active").removeClass("active");
            $(".appliedfilters > button").click();
            $('button.clear-filters').click();
        });


        //FORM SUBMISSION
        $("#searchTerms")
            .val("")
            .attr("placeholder","Enter Search Terms, Keywords, Citation, or shep: to Shepardize®")
            .keyup(function(e) {
               var code = e.keyCode ? e.keyCode : e.which;
               if (code == 13) {  // Enter keycode
                   storeSearchOpts();
               }
             });

        $('#mainSearch').click(function(e) {
            storeSearchOpts();
        });


        //INIT HLCT BASED ON STORAGE
        $('#hlct option[value="'+GM_getValue("hlct")+'"]').attr("selected","selected");

        $(".juris .selecty").append(jurisHTML);

        $("#juris-tree input:checkbox").click(function() {
            var attr = $(this).attr('data-value');

            if (typeof attr !== typeof undefined && attr !== false) {  //Top level node

                if(attr ==="allfed") {
                    if(!$(this).is(":checked")) {
                        $(".selectNoneUS")[0].click();
                    } else {
                        $(".selectAllUS")[0].click();
                    }
                }

                if($(this).is(":checked")) {
                    if(!$("input[data-id='"+attr+"']").is(":checked") || checksilent) {
                        $(".juris .selecty-selected").append("<span class='jurisfilter' data-id='"+attr+"'>"+$(this).data("id")+"<span class='icon la-CloseRemove'></span></span>").find("i").hide();
                        checksilent || $("input[data-id='"+attr+"']").click();
                    }
                } else {
                    $(".juris .selecty-selected").find("span[data-id='"+attr+"']").remove();
                    $("input[data-id='"+attr+"']").click();
                }

            } else { //Child node
                var parentNode;

                if($(this).closest("#treeview").length > 0) {
                    parentNode = $(this).closest("li:has(*[data-value])").find(" > label > input");
                } else {
                    parentNode = $(this).closest(".hummingbird-base > li").find("label").first().find("input");
                }

                attr = $(parentNode).attr('data-value');

                if($(this).is(":checked")) {
                    //check to see if parent has already been applied.  If not, apply it and click the actual filter.  If so, don't do anything.
                    if(!$("input[data-id='"+attr+"']").is(":checked")) {
                        $("input[data-id='"+attr+"']").click();
                        $(".juris .selecty-selected").append("<span class='jurisfilter' data-id='"+attr+"'>"+$(parentNode).data("id")+"<span class='icon la-CloseRemove'></span></span>").find("i").hide();
                    }
                } else {
                    //check to see if parent is still indeterminate.  If so, don't do anything.  If not, remove filter
                    parentNode.prop("indeterminate") || ($("input[data-id='"+attr+"']").click(), $(".juris .selecty-selected").find("span[data-id='"+attr+"']").remove())
                }
            }

            $(".juris .selecty-selected").find("span").length || $(".juris .selecty-selected").find("i").show();
        });

        waitForKeyElements(".jurisdiction-filters", loadjuris, true);
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



        $(document).on("click",".jurisfilter",function(e) {
            e.stopPropagation();
            var removedNode = $("#juris-tree input:checkbox[data-value='"+$(this).data("id")+"']");
            if(!removedNode.prop("indeterminate")) { //Already checked, so just uncheck
                $(removedNode).click();
            } else {
                $(removedNode).click().click(); //oh boy, this is bad.
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
                $(".deleteFilter[data-id='date']").click();
            } else {
                $(this).addClass("active");
                setDate($(this).val());
            }
        });

    }


    function storeSearchOpts() {
        //STORE HLCT
        GM_setValue("hlct", $( "#hlct option:selected" ).val());

        //STORE DATE
        if($("#datefilters > button.active").length) {
            GM_setValue("date",$("#datefilters > button.active").val());
        } else {
            GM_deleteValue("date");
        }
    }

    function sourceCheck() {
        if(!$(".appliedfilters > button").length) {
            $(".appliedfilters").hide();
            $(".hlct .selecty-selected").html($(".hlct .selecty-options > li.selected").text());
            $(".favs .selecty-selected").html("Select Recent or Favorite");
            $(".pat .selecty-selected").html("All Practice Areas");
            $(".juris .selecty-selected").html("All Jurisdictions and Courts");
            $('#clearform')[0].click();
        }
    }


    function setDate(datestring) {
        $('#date option').filter(function() {
            return ($(this).text() == datestring); 
        }).prop('selected', true).trigger('change');
        $("button.adddate").prop('disabled', false).trigger('click');
    }


    function loadjuris() {
        $(".jurisdiction-filters input:checkbox:checked").each(function() {
            $("#juris-tree input:checkbox[data-value='"+$(this).data("id")+"']").click();
        });
        //TODO - need to also add and remove based on what was done on search results
        checksilent = false;

        //$(".searchfilters").show();
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

        GM_getValue("date") || $(".deleteFilter[data-id='date']").click()
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


    function initializeForm() {

    }

    function switchHLCT() {
        $(".content-switcher-list").find("li[data-id='"+GM_getValue("hlct")+"']:not(.active) button").click();

        /*
        $(document).on("click",".content-switcher-list li",function() {
            GM_setValue("hlct",$(this).data("id"));
        });

        $(document).on("mousedown","li.applied-filter > button",function(e) {
            (e.currentTarget.title.indexOf('Timeline') > -1) && GM_deleteValue("date")
            //(e.currentTarget.title.indexOf('Topics') > -1) && GM_setValue("PATClear","true")
            //(e.currentTarget.title.indexOf('Topics') > -1) && GM_setValue("PATClear","true")
        });
        */
    }

})();