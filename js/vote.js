window.onload = function() {
    var db = firebase.firestore();
    var ties = [];

    // The date data format is going to change in Firebase, these lines
    // are to ensure this app doesnt break
    const firestore = firebase.firestore();
    const settings = {timestampsInSnapshots: true};
    firestore.settings(settings);

    db.collection("AllTies").get()
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(doc) {
            ties.push(doc.data().name);
        });
    })
    .then(function() {
        selectTie();
    });

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
            console.log("First tie votes: ", doc.data().votes);
            var votes = doc.data().votes;
            var text = "Votes: " + votes;
            var selector = docRef + "Votes";
            document.getElementById(selector).innerText=text;
        });
    }
};
