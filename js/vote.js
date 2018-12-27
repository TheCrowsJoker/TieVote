$(document).ready(function() {
    var db = firebase.firestore();
    var ties = [];

    // The date data format is going to change in Firebase, these lines
    // are to ensure this app doesnt break
    const firestore = firebase.firestore();
    const settings = {timestampsInSnapshots: true};
    firestore.settings(settings);

    readAll();

    function readAll() {
        db.collection("AllTies").get()
        .then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                ties.push(doc.data().name);
            });
        })
        .then(function() {
            console.log("Before selection: ", ties);                            // Remove when done
        })
        .then(function() {
            selectTie();
        })
        .then(function() {
            console.log("After selection:", ties);                              // Remove when done
        });
    }

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
        })
        .then(function() {
            var doc = "FirstTie";
            var votes = getVotes(doc);
            console.log(votes);
            return doc, votes;
            // setVotes(doc, votes);
        })
        .then(function() {
            setVotes(doc, votes);
        });
    }

    function getVotes(doc) {
        db.collection("TieVote").doc(doc).get()
        .then(function(doc) {
            var tieVotes = doc.data().votes;
            console.log("Votes: ", tieVotes);                                   // Remove when done
            return tieVotes;
        });
    }

    function setVotes(doc, votes) {
        db.collection("TieVote").doc(doc).update({
            votes: votes
        })
        .then(function() {                                                      // Remove when done
            console.log("Votes successfully written!");
        })
        .catch(function(error) {
            console.error("Error writing document: ", error);
        });
    }
});
