const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

let db = null;

const startServerAndDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server running at http://localhost:3000")
    );
  } catch (e) {
    console.log(`DB Error $ {
                e.message
            }

            `);
    process.exit(1);
  }
};

startServerAndDatabase();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const playerQuery = `SELECT * FROM player_details;
        `;
  const playersArray = await db.all(playerQuery);

  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id='${playerId}';
        `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerName } = request.body;

  const { playerId } = request.params;
  const updatePlayerQuery = ` UPDATE player_details SET player_name='${playerName}'
        WHERE player_id='${playerId}'; `;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `SELECT * FROM match_details WHERE match_id='${matchId}';
        `;
  const player = await db.get(getPlayerQuery);
  response.send(convertMatchDetailsDbObjectToResponseObject(player));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = ` SELECT * FROM match_details NATURAL JOIN player_match_score WHERE player_id='${playerId}';
        `;
  const playersArray = await db.all(playerQuery);

  response.send(
    playersArray.map((eachPlayer) =>
      convertMatchDetailsDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerQuery = ` SELECT * FROM player_details NATURAL JOIN player_match_score WHERE match_id='${matchId}';
        `;
  const playersArray = await db.all(playerQuery);

  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = ` SELECT player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details WHERE player_id='${playerId};`;

  const playerDetails = await db.get(getPlayerMatchDetails);
  response.send(playerDetails);
});
module.exports = app;
