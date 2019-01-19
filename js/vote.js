window.onload = function() {
    var db = firebase.firestore();
    var ties = [];

    // The date data format is going to change in Firebase, these lines
    // are to ensure this app doesnt break
    const settings = {timestampsInSnapshots: true};
    db.settings(settings);


    setup();

    showVotes("FirstTie");
    showVotes("SecondTie");

    // *********
    // FUNCTIONS
    // *********

    function setup() {
        db.collection("AllTies").get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                ties.push(doc.data());
            });
        })
        .then(function() {
            selectTie();
        })
        .then(function() {
            setFirebaseDate();
            var nextDate;
            getFirebaseTime(true);
        });
    }

    function selectTie() {
        var tie1, tie2;
        // // TODO: check to see if ties need to be set

        // Pick the first tie randomly
        tie1 = ties[Math.floor(Math.random()*ties.length)];

        // Prevent the same tie being selected twice
        var index = ties.indexOf(tie1)
        if (index >= -1) {
            ties.splice(index, 1);
        }

        // Pick the second tie
        tie2 = ties[Math.floor(Math.random()*ties.length)];

        // Set selected ties in firebase
        setTies(tie1, tie2);

        // Update the labels and values of the ties
        var vote1label = document.getElementById('vote1label');

        vote1label.getElementsByTagName('h2')[0].innerHTML=tie1.name;
        vote1label.getElementsByTagName('img')[0].src=tie1.picURL;
        vote1label.getElementsByClassName('enlargeImage')[0].href=tie1.picURL;
        vote1label.getElementsByClassName('tutorial')[0].href=tie1.tutorialURL;
        document.getElementById('vote1').value=tie1;

        var vote2label = document.getElementById('vote2label');

        vote2label.getElementsByTagName('h2')[0].innerHTML=tie2.name;
        vote2label.getElementsByTagName('img')[0].src=tie2.picURL;
        vote2label.getElementsByClassName('enlargeImage')[0].href=tie2.picURL;
        vote2label.getElementsByClassName('tutorial')[0].href=tie2.tutorialURL;
        document.getElementById('vote2').value=tie2;
    }

    function setTies(tie1, tie2) {
        // Could probably be done in a loop but this was easier
        // First tie
        db.collection("TieVote").doc("FirstTie").set({
            name: tie1,
            votes: 0
        })
        .then(function() {                                                      // Remove when done
            console.log("First tie successfully written!");
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });

        // Second tie
        db.collection("TieVote").doc("SecondTie").set({
            name: tie2,
            votes: 0
        })
        .then(function() {                                                      // Remove when done
            console.log("Second tie successfully written!");
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });
    }

    function setFirebaseDate() {
        const dayINeed = 5; // for Friday
        const today = moment().isoWeekday();
        var date;

        // if we haven't yet passed the day of the week that I need:
        if (today <= dayINeed) {
            // then just give me this week's instance of that day
            date = moment().isoWeekday(dayINeed);
        } else {
            // otherwise, give me *next week's* instance of that same day
            date = moment().add(1, 'weeks').isoWeekday(dayINeed);
        }

        date.set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        });

        db.collection("TieVote").doc("NewTie").set({
            time: new Date(date)
        })
        .then(function() {                                                      // Remove when done
            console.log("Time successfully written!");
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });
    }

    function updateVotes(tie) {
        var docRef = db.collection("TieVote").doc(tie);

        db.runTransaction(function(transaction) {
            return transaction.get(docRef).then(function(doc) {
                var votes = doc.data().votes + 1;
                transaction.update(docRef, {votes: votes});
                return votes;
            })
            .then(function(votes) {
                console.log(tie, "Votes", votes);
            }).catch(function(error) {
                console.error(error);
            });
        });
    }

    function showVotes(docRef) {
        db.collection("TieVote").doc(docRef)
        .onSnapshot(function(doc) {
            var votes = doc.data().votes;
            var text = "Votes: " + votes;
            var selector = docRef + "Votes";
            document.getElementById(selector).innerText=text;
        });
    }

    async function getFirebaseTime(updateText = false) {
        db.collection("TieVote").doc("NewTie").get()
        .then(function(doc) {
            nextDate = doc.data().time.seconds;
            return nextDate;
        })
        .then(function(nextDate) {
            if (updateText) {
                checkTimeRemaining(nextDate);
            }
        });
    }

    function checkTimeRemaining() {
        var today = Date.parse(moment()) / 1000;
        if (nextDate > today) {
            var timeToReset = nextDate - today;
            var seconds = timeToReset;
            seconds = parseInt(seconds)
            var time =  Math.floor(moment.duration(seconds,'seconds').asDays()) + ' days, ' +
                                     moment.duration(seconds,'seconds').hours() + ' hours, ' +
                                     moment.duration(seconds,'seconds').minutes() + ' minutes, ' +
                                     moment.duration(seconds,'seconds').seconds() + ' seconds';

            document.getElementById("timeToReset").innerText=time;
            setTimeout(checkTimeRemaining, 1000);
        }  else {
            console.log("Date error");
        }
    }

    // Handle voting
    document.getElementById("voteButton").onclick = function(event) {
        event.preventDefault();
        if (document.getElementById("vote1").checked) {
            updateVotes("FirstTie");
        } else if (document.getElementById("vote2").checked) {
            updateVotes("SecondTie");
        } else {
            console.log("Incorrect selection");
        }
    };
};
