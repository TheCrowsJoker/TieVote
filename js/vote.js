$(document).ready(function() {
    var db = firebase.firestore();
    var ties = [];

    // The date data format is going to change in Firebase, these lines
    // are to ensure this app doesnt break
    const firestore = firebase.firestore();
    const settings = {/* your settings... */ timestampsInSnapshots: true};
    firestore.settings(settings);

    function readAll() {
        db.collection("AllTies").get().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                ties.push(doc.data().Name);
            });
        })
        .then(function() {
            console.log("Before selection: ", ties);                                                  // Remove when done
        })
        .then(function() {
            selectTie();
        })
        .then(function() {
            console.log("After selection:", ties);                                                  // Remove when done
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

        // Update the labels of the ties
        document.getElementById('vote1label').innerText=tie1;
        document.getElementById('vote2label').innerText=tie2;
    }

    readAll();
});
