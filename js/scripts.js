jQuery(function($){

  $("selectNOT").change(function(){
    var search = [];

    //$(".result-row").addClass("js-hidden");

    $("select").each(function(i) {
      var el = $(this),
          selected = el.val();

      if (selected != "none"){
        search[i] = selected;
      } else {
        return;
      }
    });

    for (i = 0; i < search.length; i++) {

      $(".result-row").each(function() {
        var el = $(this),
            lookup = el.attr("data-find");

        var check = lookup.search(search[i]);
        //console.log(check);

        if (lookup.search(search[i]) > 0) {
          el.addClass("js-visible")
            .removeClass("js-hidden");
        } else {
          el.removeClass("js-visible")
            .addClass("js-hidden");
          return;
        }
      });

    }

  });

});
