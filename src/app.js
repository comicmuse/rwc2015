/**
 * 
 */

var UI = require('ui');
var ajax = require('ajax');

// Create a Card with title and subtitle
var card = new UI.Card({
  title:'RWC 2015',
  subtitle:'Fetching...'
});

card.on('click', 'select', function ()
       {
         reloadfrontpage();       
       }
);

// Display the Card
card.show();

reloadfrontpage();


function reloadfrontpage () {
// Get the schedule of matches
  var URL = 'http://cmsapi.pulselive.com/rugby/event/1238/schedule?language=en';
ajax(
  {
    url: URL,
    type: 'json'
  },
  function(data) {
    // Success!
    console.log('Successfully fetched match schedule');
    var text ='';
    var i=0;
    while (i<data.matches.length && data.matches[i].status == 'C')
      {
        i++;
      }
    //There is no current match
    if (data.matches[i].status == 'U')
      {
        text = '\nFT:' + data.matches[i-1].teams[0].abbreviation + ' ' + data.matches[i-1].scores[0] + '-' +  data.matches[i-1].scores[1] +' ' + data.matches[i-1].teams[1].abbreviation + '\n\n';
        text = text + 'Next: ' + data.matches[i].teams[0].abbreviation + ' v ' + data.matches[i].teams[1].abbreviation + '\n';
        text = text + data.matches[i].time.label;
    
      }
    //We're at half time
    else if (data.matches[i].status=='LHT')
      {
        text = '\nHT:' + data.matches[i].teams[0].abbreviation + ' ' + data.matches[i].scores[0] + '-' +  data.matches[i].scores[1] +' ' + data.matches[i].teams[1].abbreviation + '\n\n';
      }
    //In play
    else if (data.matches[i].status=='L1' || data.matches[i].status == 'L2') 
      {
         text = data.matches[i].teams[0].abbreviation + ' ' + data.matches[i].scores[0] + '-' +  data.matches[i].scores[1] +' ' + data.matches[i].teams[1].abbreviation + '\n\n';
      }
    else if (data.matches[i].status =='LT1')
      {
        text = '\nNext: ' + data.matches[i].teams[0].abbreviation + ' v ' + data.matches[i].teams[1].abbreviation + '\n';
      }
    else
      {
        text = "Unexpected Error.";
      }
    card.subtitle('');
    card.body(text);    
    
    
  },
  function(error) {
    // Failure!
    console.log('Failed fetching match schedule: ' + error);
  } 
);
}