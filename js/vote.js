window.onload = function () {
    var db = firebase.firestore();
    var ties = [];
    let voteEndTime = 0;

    // The date data format is going to change in Firebase, these lines
    // are to ensure this app doesnt break
    const settings = { timestampsInSnapshots: true };
    db.settings(settings);

    setup();

    showVotes("FirstTie");
    showVotes("SecondTie");

    // *********
    // FUNCTIONS
    // *********

    async function setup() {
        const querySnapshot = await db.collection("AllTies").get();
        querySnapshot.forEach(function (doc) {
            ties.push(doc.data());
        });
        await selectTie();
        checkTimeRemaining();
    }

    async function selectTie() {
        var tie1, tie2;
        const { lastFriday, nextFriday } = calculateNextLastFridays();
        voteEndTime = await getFirebaseTime();

        // See whether the vote is for this week or last.
        if (voteEndTime <= lastFriday.unix()) {
            // Set the time the next vote closes.
            setFirebaseDate(nextFriday);
            voteEndTime = nextFriday.unix();

            // Pick the first tie randomly
            tie1 = ties[Math.floor(Math.random() * ties.length)];

            // Prevent the same tie being selected twice
            var index = ties.indexOf(tie1)
            if (index >= -1) {
                ties.splice(index, 1);
            }

            // Pick the second tie
            tie2 = ties[Math.floor(Math.random() * ties.length)];

            // Set selected ties in firebase
            // (Don't need to "await" for these to finish, because we're using
            // onSnapshot() to do updates when they finish)
            setTie("FirstTie", tie1);
            setTie("SecondTie", tie2);
        } else {
            const [tie1Data, tie2Data] = await Promise.all([
                db.collection("TieVote").doc("FirstTie").get(),
                db.collection("TieVote").doc("SecondTie").get(),
            ]);
            tie1 = tie1Data.data();
            tie2 = tie2Data.data();
        }


        // Update the labels and values of the ties
        var vote1label = document.getElementById('vote1label');

        vote1label.getElementsByTagName('h2')[0].innerHTML = tie1.name;
        vote1label.getElementsByTagName('img')[0].src = tie1.picURL;
        vote1label.getElementsByClassName('enlargeImage')[0].href = tie1.picURL;
        vote1label.getElementsByClassName('tutorial')[0].href = tie1.tutorialURL;
        document.getElementById('vote1').value = tie1;

        var vote2label = document.getElementById('vote2label');

        vote2label.getElementsByTagName('h2')[0].innerHTML = tie2.name;
        vote2label.getElementsByTagName('img')[0].src = tie2.picURL;
        vote2label.getElementsByClassName('enlargeImage')[0].href = tie2.picURL;
        vote2label.getElementsByClassName('tutorial')[0].href = tie2.tutorialURL;
        document.getElementById('vote2').value = tie2;
    }

    /**
     *
     * @param {string} tiePath The documentPath for one of the tie vote counts
     * @param {string} tieData The name of the tie at that path
     * @return {Promise}
     */
    async function setTie(tiePath, tieData) {
        try {
            // Could probably be done in a loop but this was easier
            // First tie
            await db
                .collection("TieVote")
                .doc(tiePath)
                .set({
                    ...tieData,
                    votes: 0
                });
            console.log(`${tiePath} successfully written!`);
        } catch (error) {
            console.error(`Error writing ${tiePath}: ${tieData.name}`, error);
        }
    }

    /**
     * Retrieve the current voting period's end date from Firebase.
     * @return {Promise<int>} The time, in seconds since epoch.
     */
    async function getFirebaseTime() {
        const doc = await db
            .collection("TieVote")
            .doc("NewTie")
            .get();

        return doc.data().time.seconds;
    }

    function calculateNextLastFridays() {
        const dayINeed = 5; // for Friday
        const today = moment().isoWeekday();
        var nextFriday;

        // if we haven't yet passed the day of the week that I need:
        if (today <= dayINeed) {
            // then just give me this week's instance of that day
            nextFriday = moment().isoWeekday(dayINeed);
        } else {
            // otherwise, give me *next week's* instance of that same day
            nextFriday = moment().add(1, 'weeks').isoWeekday(dayINeed);
        }

        nextFriday.set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 0
        });

        const lastFriday = moment(nextFriday).subtract(7, 'days');
        return { nextFriday, lastFriday };
    }

    /**
     * Set the date of the next fancy tie Friday, in the DB
     */
    async function setFirebaseDate(nextFriday) {
        try {
            await db
                .collection("TieVote")
                .doc("NewTie")
                .set({
                    time: nextFriday.toDate()
                });
            console.log("Time successfully written!");
        } catch (error) {
            console.error("Error writing document: ", error);
        }
    }

    /**
     *
     * @param {string} tiePath The documentPath for one of the ties' vote counts
     */
    function updateVotes(tiePath) {
        var docRef = db.collection("TieVote").doc(tiePath);

        db.runTransaction(async function (transaction) {
            try {
                const doc = await transaction.get(docRef);
                var votes = doc.data().votes + 1;
                transaction.update(docRef, { votes: votes });
                console.log(tiePath, "Votes", votes);
            } catch (error) {
                console.error(error);
            }
        });
    }

    function showVotes(docRef) {
        db.collection("TieVote").doc(docRef)
            .onSnapshot(function (doc) {
                var votes = doc.data().votes;
                var text = "Votes: " + votes;
                var selector = docRef + "Votes";
                document.getElementById(selector).innerText = text;
            });
    }

    function checkTimeRemaining() {
        var today = Date.parse(moment()) / 1000;
        if (voteEndTime > today) {
            var timeToReset = voteEndTime - today;
            var seconds = timeToReset;
            seconds = parseInt(seconds)
            var time = Math.floor(moment.duration(seconds, 'seconds').asDays()) + ' days, ' +
                moment.duration(seconds, 'seconds').hours() + ' hours, ' +
                moment.duration(seconds, 'seconds').minutes() + ' minutes, ' +
                moment.duration(seconds, 'seconds').seconds() + ' seconds';

            document.getElementById("timeToReset").innerText = time;
            setTimeout(checkTimeRemaining, 1000);
        } else {
            console.log("Date error");
        }
    }

    // Handle voting
    document.getElementById("voteButton").onclick = function (event) {
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
