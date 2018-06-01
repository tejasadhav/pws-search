$(function(){
  $("#search-input").autocomplete({
    source: function (request, response) {
       $.ajax({
          url: "/search/search_member",
          type: "GET",
          data: request,  // request is the value of search input
          success: function (data) {
            // Map response values to fiedl label and value
            console.log(data);
             response($.map(data, function (el) {
                return {
                   label: el.query,
                   value: el._id
                };
                }));
             }
          });
       },
       
       // The minimum number of characters a user must type before a search is performed.
       minLength: 1, 
       
       // set an onFocus event to show the result on input field when result is focused
       focus: function (event, ui) { 
          this.value = ui.item.label; 
          console.log(this.value);
          // Prevent other event from not being execute
          event.preventDefault();
       },
       select: function (event, ui) {
          // Prevent value from being put in the input:
          this.value = ui.item.label;
          // Set the id to the next input hidden field
          $(this).next("input").val(ui.item.value); 
          // Prevent other event from not being execute            
          event.preventDefault();
          // optionnal: submit the form after field has been filled up
        //  $('#quicksearch').submit();
       }
});

$('div.save-link').on('click', function() {
    var Title = $(this).find('a').text()
    var URL = $(this).find('a').attr('href')
    var Snippet = $(this).find('p:last').text()
    var parameters = { title: Title, url: URL, snippet: Snippet };
    console.log(parameters)
    $.get( '/search/save', parameters);
  });

});