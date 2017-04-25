jQuery(function($) {

  var rows = $(".result-row");

  $(".results-text").text(rows.length);

  $("select").change(function() {
    var el = $(this),
        attr = el.attr("class").replace("filter-",""),
        selected = el.val();

    //console.log("Value: "+ selected +" attr: "+attr);

    if (selected != "none"){
      rows.each(function() {
        var el = $(this),
            lookup = el.attr("data-"+attr);

        if (lookup.search(selected) >= 0) {
          el.removeClass("js-hidden-"+attr);
        } else {
          el.addClass("js-hidden-"+attr);
        }
      });
    } else {
      rows.each(function() {
        $(this).removeClass("js-hidden-"+attr);
      });
    }

  });

});

$(function () {
    $("table").stickyTableHeaders();
});
