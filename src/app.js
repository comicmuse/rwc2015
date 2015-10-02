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
  card.subtitle("Refreshing...");
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
    else if (data.matches[i].status=='LHT'|| data.matches[i].status=='L1' || data.matches[i].status == 'L2')
      {
        inplay(data.matches[i].matchId);
      }
    else if (data.matches[i].status =='LT1')
      {
        text = '\nNext: ' + data.matches[i].teams[0].abbreviation + ' v ' + data.matches[i].teams[1].abbreviation + '\n';
        text = text+ 'Select to refresh';
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
    card.body ("Sorry. Something went wrong.");
  } 
);
}


function inplay(matchId) {
  //Set up some variables
  var team1, team2;
  var teamlist1 = new Array();
  var teamlist2 = new Array();
  
  //Get initial match detail
  var URL = 'http://cmsapi.pulselive.com/rugby/match/' + matchId + '/summary?language=en&client=pebble';
  ajax(
    {
      url: URL,
      type: 'json'
    },
    function(data) {
      //Store the team names for ease of reference
      team1 = data.match.teams[0].abbreviation;
      team2 = data.match.teams[1].abbreviation;
      
      
      //Cache the player lists for later use with scoring
      for (var i=0; i<=data.teams[0].teamList.list; i++)
      {
        if (data.teams[0].teamList.list[i].player.name.last.known !== null) {
          teamlist1[data.teams[0].teamList.list[i].player.id] = data.teams[0].teamList.list[i].player.name.last.known;
        }
        else {
          teamlist1[data.teams[0].teamList.list[i].player.id] = data.teams[0].teamList.list[i].player.name.last.official;
        }
      }
      for ( i=0; i<=data.teams[1].teamList.list; i++)
      {
        if (data.teams[1].teamList.list[i].player.name.last.known !== null) {
          teamlist2[data.teams[1].teamList.list[i].player.id] = data.teams[1].teamList.list[i].player.name.last.known;
        }
        else {
          teamlist2[data.teams[1].teamList.list[i].player.id] = data.teams[1].teamList.list[i].player.name.last.official;
        }
      }
      
      var text = data.match.teams[0].abbreviation + ' ' + data.match.scores[0] + '-' + data.match.scores[1] + ' ' + data.match.teams[1].abbreviation + '\n';
      text = text + data.match.clock.label;
      card.body (text);

      
      //Main In-Play Loop
      
      var pointlessVar = setInterval (inplayloop, 60000);
      function inplayloop (){
        ajax(
        {
          url: URL,
          type: 'json'
        },
        function (data){
          var text='';
          if (data.match.status=='C') {
            text = 'FT:';
            clearInterval(pointlessVar);
          }
          text = text + data.match.teams[0].abbreviation + ' ' + data.match.scores[0] + '-' + data.match.scores[1] + ' ' + data.match.teams[1].abbreviation + '\n';
          text = text + data.match.clock.label;
          card.body (text);
        },
        function (error) {
          console.log('Failed updating match details: ' + error);
        });

      }
      //End of Main In-Play Loop
            
    },
    function (error){
      console.log('Failed fetching initial match detail' + error);
      card.body ("Sorry. Something went wrong.");
    }
  );
  
  
}