jQuery(function($){

  $("th.td-filter").each(function(){
    var el = $(this),
        elClass = el.attr("data-class");

    el.append("<select class='"+elClass+"'><option value='none'>- select -</option></select>");
  });

  var uniqueTexts = [];

  $("td.td-filter").each(function(){
    var el = $(this),
        text = el.text().split(","),
        elClass = el.attr("data-class"),
        select = $("select."+elClass);

      for (var i = 0; i < text.length; i++) {
        text[i] = text[i].replace(" ", "");
        select.append("<option class='"+text[i]+"'>"+text[i]+"</option>");
      }
  });

  var options = $("#list option");


  var usedOptions = {};
  $("th select option").each(function(){
    var el = $(this),
        elText = el.text();

    if (usedOptions[elText] && elText !== "- select -") {
      el.remove();
    } else {
      usedOptions[elText] = elText;
    }
  });

  $("th select").change(function(){
    $(".result-row").addClass("js-hidden");

    var el = $(this),
        selected = el.val();

    $("td:contains('"+selected+"')").parent().addClass("js-visible").removeClass("js-hidden");

  });

});
