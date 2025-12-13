jQuery(function($) {

  const rows = $(".result-row"),
        body = $("body"),
        rowsContainer = rows.parent();

  $(".results-text").text(rows.length);

  // Style deprecated items
  $(".filter-category").each(function() {
    const $this = $(this);
    const text = $this.text();
    if (text.toLowerCase().includes("deprecated")) {
      // Find and wrap the "deprecated" text
      const deprecatedText = $this.text().replace(/deprecated/gi, '<span class="deprecated">deprecated</span>');
      $this.html(deprecatedText);
    }
  });

  // Search functionality
  $(".search-input").on("keyup", function() {
    const searchTerm = $(this).val().toLowerCase();
    
    rows.each(function() {
      const el = $(this),
            name = el.attr("data-name") ? el.attr("data-name").toLowerCase() : "",
            category = el.attr("data-category") ? el.attr("data-category").toLowerCase() : "",
            requires = el.attr("data-requires") ? el.attr("data-requires").toLowerCase() : "",
            description = el.find(".description").text().toLowerCase();
      
      if (name.indexOf(searchTerm) >= 0 || 
          category.indexOf(searchTerm) >= 0 || 
          requires.indexOf(searchTerm) >= 0 ||
          description.indexOf(searchTerm) >= 0) {
        el.removeClass("js-hidden-search");
      } else {
        el.addClass("js-hidden-search");
      }
    });
    
    updateResultsCount();
  });

  // Sort functionality
  $(".sort-by").change(function() {
    const sortValue = $(this).val();
    
    if (sortValue === "none") {
      return;
    }
    
    const sortedRows = rows.sort(function(a, b) {
      const aEl = $(a),
            bEl = $(b);
      
      if (sortValue === "name-asc") {
        const aName = aEl.attr("data-name") || "",
              bName = bEl.attr("data-name") || "";
        return aName.localeCompare(bName);
      } else if (sortValue === "name-desc") {
        const aName = aEl.attr("data-name") || "",
              bName = bEl.attr("data-name") || "";
        return bName.localeCompare(aName);
      } else if (sortValue === "created-asc") {
        const aYear = parseInt(aEl.attr("data-created")) || 0,
              bYear = parseInt(bEl.attr("data-created")) || 0;
        return aYear - bYear;
      } else if (sortValue === "created-desc") {
        const aYear = parseInt(aEl.attr("data-created")) || 0,
              bYear = parseInt(bEl.attr("data-created")) || 0;
        return bYear - aYear;
      }
      return 0;
    });
    
    rowsContainer.append(sortedRows);
  });

  // Filter functionality
  $("select:not(.sort-by)").change(function() {
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
    
    updateResultsCount();
  });

  function updateResultsCount() {
    const visibleRows = rows.filter(":visible").length;
    $(".results-text").text(visibleRows);
  }

  // Click to open a project
  $(".js-more").click(function(e){
    e.preventDefault();

    const el = $(this),
          project = el.attr("href"),
          parent = el.parent().parent();

    parent.addClass("js-active-project");
    body.addClass("js-has-open-project");

    gaPopup("click", project, "open_project", 1);

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
