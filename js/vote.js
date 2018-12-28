window.onload = function() {
    var db = firebase.firestore();
    var ties = [];

    // The date data format is going to change in Firebase, these lines
    // are to ensure this app doesnt break
    const firestore = firebase.firestore();
    const settings = {timestampsInSnapshots: true};
    firestore.settings(settings);

    function setup() {
        db.collection("AllTies").get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                ties.push(doc.data().name);
            });
        })
        .then(function() {
            selectTie();
        })
        .then(function() {
            setFirebaseDate();
        });
    }

    setup();

    showVotes("FirstTie");
    showVotes("SecondTie");

    function selectTie() {
        // Pick the first tie randomly
        var tie1 = ties[Math.floor(Math.random()*ties.length)];

        // Prevent the same tie being selected twice
        var index = ties.indexOf(tie1)
        if (index >= -1) {
            ties.splice(index, 1);
        }

        // Pick the second tie
        var tie2 = ties[Math.floor(Math.random()*ties.length)];

        // Update the labels and values of the ties
        document.getElementById('vote1label').innerText=tie1;
        document.getElementById('vote1').value=tie1;
        document.getElementById('vote2label').innerText=tie2;
        document.getElementById('vote2').value=tie2;

        // Set selected ties in firebase
        setTies(tie1, tie2);
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
        var date = new Date();
        date.setHours(0,0,0,0);
        db.collection("TieVote").doc("NewTie").set({
            time: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
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

    function showVotes(docRef) {
        db.collection("TieVote").doc(docRef)
        .onSnapshot(function(doc) {
            var votes = doc.data().votes;
            var text = "Votes: " + votes;
            var selector = docRef + "Votes";
            document.getElementById(selector).innerText=text;
        });
    }

    function getFirebaseTime() {
        db.collection("TieVote").doc("NewTie").get()
        .then(function(doc) {
            nextDate = doc.data().time.seconds;
            return nextDate;
        })
        .then(function(nextDate) {
            checkTimeRemaining(nextDate);
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
        } else if (nextDate <= today) {
            setup();
        } else {
            console.log("Date error");
        }
    }

    var nextDate;
    getFirebaseTime();
};
