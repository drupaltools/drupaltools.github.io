jQuery(function($) {

  const rows = $(".result-row"),
        body = $("body");

  $(".results-text").text(rows.length);

  $("select").change(function() {
    const el = $(this),
          attr = el.attr("class").replace("filter-",""),
          selected = el.val();

    //console.log("Value: "+ selected +" attr: "+attr);

    if (selected != "none"){
      rows.each(function() {
        const el = $(this),
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

  // Click to open a project
  $(".js-more").click(function(e){
    e.preventDefault();

    const el = $(this),
          project = el.attr("href"),
          parent = el.parent().parent();

    parent.addClass("js-active-project");
    body.addClass("js-has-open-project");

    gtag("event", "popup_project", "open_project", 1);

    $(".overlay, .js-close").click(function(){
      parent.removeClass("js-active-project");
      body.removeClass("js-has-open-project");
    });
  });

  function gaPopup(event, label, category, value) {
    gtag("event", event, {
      "event_label": label,
      "event_category": category,
      "value": value,
      "non_interaction": true
    });
  }

});

$(function () {
    $("table").stickyTableHeaders();
});
