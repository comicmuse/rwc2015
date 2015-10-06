/**
 * Pebble RWC 2015 app by Colm Linehan
 * v1.3
 */

var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
//Identify platform
var current_watch;
if(Pebble.getActiveWatchInfo) {
  try {
    current_watch = Pebble.getActiveWatchInfo();
  } catch(err) {
    current_watch = {
      platform: "basalt",
    };
  }
} else {
  current_watch = {
    platform: "aplite",
  };
}

console.log ('Starting rwc2015 at ' + new Date().toString());
console.log('current watch platform:' + current_watch.platform);

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
card.subtitle("Loading...");

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
        notinplay(data.matches[i-1], data.matches[i]);
      }
    //#TODO reserved for future half-time development
    /*else if () 
      {
        halftime(data.matches[i].matchId);
      }*/
    else if (data.matches[i].status=='LHT' || data.matches[i].status=='L1' || data.matches[i].status == 'L2')
      {
        inplay(data.matches[i].matchId);
      }
    else if (data.matches[i].status =='LT1')
      {
        //#TODO break this out somewhere sensible
        text = '\nComing Up: ' + data.matches[i].teams[0].abbreviation + ' v ' + data.matches[i].teams[1].abbreviation + '\n';
        text = text+ 'Select to refresh';
      }
    else
      {
        //#TODO proper error handling
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
  var window = new UI.Window({fullscreen: true});
  //Set up some variables
  var team1, team2;
  var playerlist = new Array();
  //Set up the display
  
  var scorelayer = new UI.Text ({
    position: new Vector2(0,0),
    size: new Vector2(144, 30),
    font: 'gothic-28-bold',
    text: 'loading',
    textAlign: 'center',
    backgroundColor: 'white',
    color: 'black'
  });
  var timelayer = new UI.Text ({
    position: new Vector2(0,30),
    size: new Vector2(144, 20),
    font: 'gothic-14',
    text: '',
    textAlign: 'center',
    backgroundColor: 'white',
    color: 'black'    
  });
  var eventslayer = new UI.Text ({
    position: new Vector2(0,50),
    size: new Vector2(144, 94),
    font: 'gothic-14',
    text: '',
    textAlign: 'left',
  });  

  //override for colour support
  if (current_watch.platform == 'basalt') {
    scorelayer.backgroundColor('islamicGreen');
    scorelayer.color('white');
    timelayer.backgroundColor('islamicGreen');
    timelayer.color('white');
    eventslayer.backgroundColor('blue');
    eventslayer.color('white');
  }
  
  window.add(scorelayer);
  window.add(timelayer);
  window.add(eventslayer);
  console.log('set up in-play window');
  card.hide();
  window.show();
  console.log('showing in-play window');
  //Utility Functions
  function scoretemplate(score1, score2) {
    return team1 + ' ' + score1 + '-' + score2 + ' ' + team2;
  }
  
  function updateevents(data){
    //extract all the events from the game, put them in an array, sort it backwards, and return it. 
    var eventsArray = new Array();
    var eventTimesArray = new Array();
    for (var team =0 ; team < data.teams.length; team++ ) {
      if (data.teams[team].scoring.Try !== undefined) {
        for (var atry=0; atry < data.teams[team].scoring.Try.length; atry++) {
          eventsArray[data.teams[team].scoring.Try[atry].time.secs] = data.teams[team].scoring.Try[atry].time.label + ': Try - ' + playerlist[data.teams[team].scoring.Try[atry].playerId];
          eventTimesArray.push(data.teams[team].scoring.Try[atry].time.secs);
        }
      }
      if (data.teams[team].scoring.Con !== undefined) {
        for (var con=0; con < data.teams[team].scoring.Con.length; con++) {
          eventsArray[data.teams[team].scoring.Con[con].time.secs] =  data.teams[team].scoring.Con[con].time.label + ': Con - ' + playerlist[data.teams[team].scoring.Con[con].playerId];
          eventTimesArray.push(data.teams[team].scoring.Con[con].time.secs);
        }
      }
      if (data.teams[team].scoring.Pen !== undefined) {
        for (var pen=0; pen < data.teams[team].scoring.Pen.length; pen++) {
          eventsArray[data.teams[team].scoring.Pen[pen].time.secs] =  data.teams[team].scoring.Pen[pen].time.label + ': Pen - ' + playerlist[data.teams[team].scoring.Pen[pen].playerId];
          eventTimesArray.push(data.teams[team].scoring.Pen[pen].time.secs);
        }
      }
      if (data.teams[team].scoring.DG !== undefined) {
        for (var dg=0; dg < data.teams[team].scoring.DG.length; dg++) {
          eventsArray[data.teams[team].scoring.DG[dg].time.secs] =  data.teams[team].scoring.DG[dg].time.label + ': DG - ' + playerlist[data.teams[team].scoring.DG[dg].playerId];
          eventTimesArray.push(data.teams[team].scoring.DG[dg].time.secs);
        }
      }
      
      if (data.teams[team].disciplinary !== undefined) {
        for (var yc=0; yc < data.teams[team].disciplinary.YC.length; yc++) {
          eventsArray[data.teams[team].disciplinary.YC[yc].time.secs] =  data.teams[team].disciplinary.YC[yc].time.label + ': Bin - ' + playerlist[data.teams[team].disciplinary.YC[yc].playerId];
          eventTimesArray.push(data.teams[team].disciplinary.YC[yc].time.secs);
        }
      }
      if (data.teams[team].disciplinary.RC !== undefined) {
        for (var rc=0; rc < data.teams[team].disciplinary.RC.length; rc++) {
          eventsArray[data.teams[team].disciplinary.RC[rc].time.secs] =  data.teams[team].disciplinary.RC[rc].time.label + ': Off - ' + playerlist[data.teams[team].disciplinary.RC[rc].playerId];
          eventTimesArray.push(data.teams[team].disciplinary.RC[rc].time.secs);
        }
      }
    }
    //ok, now sort the event times
    eventTimesArray.sort(function (a, b) {return b-a;}); 
    console.log('The eventTimesArray:' + eventTimesArray.toString());
    
    //construct a string of the events
    var text = '';
    for (var i = 0; i < eventTimesArray.length && i<8; i++) {
      text = text + eventsArray[eventTimesArray[i]] + '\n';
    }
    console.log(text);
    return text;
  }
  
  
  //few of statics so we minimise updates to the window
  var lastscorelayer='';
  var lasteventslayer='';
  var lasttimelayer='';
  
  function updateinplaywindow(data){
      var newscorelayer=scoretemplate(data.match.scores[0], data.match.scores[1]);
      var neweventslayer=updateevents(data);
      var newtimelayer=data.match.clock.label;
      if (newscorelayer !== lastscorelayer) {
        scorelayer.text(newscorelayer);
        lastscorelayer=newscorelayer;
        console.log ('updated scorelayer');
      }
      if (neweventslayer !== lasteventslayer) {
        eventslayer.text(neweventslayer);
        lasteventslayer=neweventslayer;
        console.log ('updated eventslayer');
      }
      if (newtimelayer !== lasttimelayer) {
        timelayer.text (newtimelayer);
        lasttimelayer=newtimelayer;
        console.log ('updated timelayer');
      }
      console.log ('Screen update requested but nothing to do');
  }
  
  //Get initial match detail
  var URL = 'http://cmsapi.pulselive.com/rugby/match/' + matchId + '/summary?language=en&client=pebble';
  ajax(
    {
      url: URL,
      type: 'json'
    },
    function(data) {
      console.log('Got initial in-play match data');
      //Store the team names for ease of reference
      team1 = data.match.teams[0].abbreviation;
      team2 = data.match.teams[1].abbreviation;
            
      //Cache the player lists for later use
      for (var team =0; team <=1; team++) {
        for (var i=0; i<data.teams[team].teamList.list.length; i++)
        {
          if (data.teams[team].teamList.list[i].player.name.last.known !== null) {
            playerlist[data.teams[team].teamList.list[i].player.id] = data.teams[team].teamList.list[i].player.name.last.known;
          }
          else {
            playerlist[data.teams[team].teamList.list[i].player.id] = data.teams[team].teamList.list[i].player.name.last.official;
          }
        }
      }
      console.log ('Cached Player List:' + playerlist.length);
      
      updateinplaywindow(data);
            
      //Main In-Play Loop
      
      var pointlessvar = setInterval (inplayloop, 60000);
      
      function inplayloop (){
        console.log('inplay loop is running');
        ajax(
        {
          url: URL,
          type: 'json'
        },
        function (data){
          if (data.match.status=='C') {
            window.hide();
            card.show();
            //Ignore the error. It's a cloudpebble issue
            clearInterval(pointlessvar);
            console.log ('hopefully we have cleared the interval');
            return;
          } 
          console.log('inplay loop updated json');
          updateinplaywindow(data);
        },
        function (error) {
          timelayer('Something went wrong. Please reopen');
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

function notinplay(match1, match2) {
  var window = new UI.Window({fullscreen: false});

  var lastgamelayer = new UI.Text ({
    position: new Vector2(0,0),
    size: new Vector2(144, 65),
    font: 'gothic-24-bold',
    text: '\n' + match1.teams[0].abbreviation + ' ' + match1.scores[0] + '-' + match1.scores[1] +' ' + match1.teams[1].abbreviation,
    textAlign: 'center',
    backgroundColor: 'white',
    color: 'black'
  });
  
  var nextgamelayer = new UI.Text ({
    position: new Vector2(0,65),
    size: new Vector2(144, 100),
    font: 'gothic-24-bold',
    text: 'Next: ' + match2.teams[0].abbreviation + ' v ' + match2.teams[1].abbreviation + '\n' + match2.time.label,
    textAlign: 'center',
    backgroundColor: 'black',
    color: 'white'    
  });
  //override for colour support
  if (current_watch.platform == 'basalt') {
    lastgamelayer.backgroundColor('islamicGreen');
    lastgamelayer.color('white');
    nextgamelayer.backgroundColor('blue');
    nextgamelayer.color('white');
  }
  
  window.add(lastgamelayer);
  window.add(nextgamelayer);
  console.log('set up schedule window');
  card.hide();
  window.show();
  console.log('showing schedule window');  
}