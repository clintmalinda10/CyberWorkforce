const express = require('express');
const app = express();
const session = require('express-session')
var path = require('path');
var bodyParser = require('body-parser');
var engines = require('consolidate');

//Session
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

// Views
app.engine('pug', engines.pug);

app.engine('ejs', engines.ejs);

app.set('view engine', 'pug');

//End of Views
const cons = require('consolidate');
const { request } = require('http');
app.use(express.static(path.join(__dirname, 'public')));

// Database
const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./NICE.db');
// End databases

db.run('CREATE TABLE IF NOT EXISTS Users (ID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,Username TEXT NOT NULL UNIQUE, Email TEXT NOT NULL,Team_Name TEXT,Occupation TEXT NOT NULL,Password TEXT NOT NULL)');
db.run('CREATE TABLE IF NOT EXISTS Teams (Team_ID INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,Team_Name TEXT NOT NULL, Team_Score INTEGER NOT NULL)');

app.get("/home", (req, res) => {
    res.render("home.ejs");
});
// Json files for sign up.
var team;
var K_Req;
var S_Req;
var A_Req;
var name;
var surname;
var job;
var team_select;
var degree1;
var degree2;
var cert1;
var cert2;
var know;
var skill;
var ability;
var team_assess;
var ability_rows;
var skill_rows;
var know_rows;

app.get('/', (req, res) => {
  res.render("dash.ejs");
});

app.get('/index', (req, res) => {
  res.render("index.ejs");
});

app.get('/create_a_team', (req, res) => {
  res.render("create_a_team.ejs");
});

app.post('/create_a_team', (req, res) => {
  team = req.body.team_name;
  K_Req = req.body.knowledge;
  S_Req = req.body.skill;
  A_Req = req.body.ability;

  //Inserting data into database
  db.run(`INSERT INTO Teams(Team_Name, K_Req, S_Req, A_Req) VALUES(?, ?, ?, ?)`, [team, K_Req, S_Req, A_Req], function(err) {
    if (err) {
      return console.log(err.message);
    }else{
      console.log("Insert successful!");
    }

  });  

  res.redirect("/");
});


// Sign up route

app.get("/sign_up", (req, res) => {
    const sql1 = "SELECT Job_Name FROM Jobs";
    const sql2 = "SELECT Team_Name FROM Teams";
  db.all(sql1, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    db.all(sql2, [], (err, rows1) => {
      if (err) {
        return console.error(err.message);
      }
      
      res.render("sign_up.ejs", { model: rows, model1:rows1 });
      
    });
  
    
    //res.render("sign_up.ejs", { model: rows });
    
  });

});

app.post('/sign_up', (req, res) => {
  name = req.body.name;
  surname = req.body.surname
  job = req.body.role;
  team_select = String(req.body.team_chosen);

console.log("team",team_select.length);
sql = 'INSERT INTO Users(Name, Team_Name, Job, Date) VALUES(?, ?, ?, datetime("now","localtime"))';
sql1  = 'SELECT No_members FROM Teams WHERE Team_Name = '+'"'+team_select+'"'; 
  db.run(sql, [name+" "+surname, team_select, job], function(err) {
    if (err) {
      console.log("Insert Error");
      return console.log(err.message);
    }
    
    if (team_select != "None") {
     
      db.all(sql1,[], (err, rows1) => {
        if(err){
          console.log(err.message)
        }

        let members = rows1[0].No_members;
      let sql2 = 'UPDATE Teams SET No_members = ? WHERE Team_Name = ? '; 
      if (members == null) {
        members = Number(1);
        let data = [String(members), String(team_select)];
        //SQL
        db.run(sql2, data, function(err) {
          if(err){
            return console.log(err.message);
          }
        
        });
        //SQL end
      }else{
        members = Number(members) + 1;
        let data = [String(members), String(team_select)];
        //SQL
        db.run(sql2, data, function(err) {
          if(err){
            return console.log(err.message);
          }
    
        });
        //SQL end
      }

        
      });

      
    }else{
      console.log("No team selected");
    }

  });

  res.redirect('/qualifications');
});

//Team assess

app.get('/team_assessment', (req, res) => {
  let sql = "SELECT Team_Name FROM Teams WHERE No_members >= 1";
  db.all(sql, [], (err, rows) => {
    if(err){
      return console.log(err.message);
    }
    res.render('teams.ejs', {model1:rows})
  });
});

app.post('/team_assessment', (req, res) => {
  team_assess = req.body.team_chosen;
  // Add redirect route
})

//End of team assess

//Qualifications

app.get('/qualifications', (req, res) => {

  sql = "SELECT Degree_Name FROM Job_Degree WHERE Job_Id = (SELECT Job_Id FROM Jobs WHERE Job_Name = "+"'"+job+"'"+")";
  console.log(sql);
  db.all(sql, [], (err, rows) => {
    if(err){
      return console.log(err.message);
    }

    res.render("qualifications.ejs", {model2:rows})
  });
});

app.post('/qualifications', (req, res) => {
  degree1 = req.body.q1;
  degree2 = req.body.q2;
  cert1 = req.body.c1;
  cert2 = req.body.c2;

  let sql = 'UPDATE Users SET Q1 = ?, Q2 = ?, C1 = ?, C2 = ? WHERE Name = ? ';
  let data = [String(degree1),String(degree2), String(cert1), String(cert2), name+" "+surname];
  db.run(sql, data, (err) => {
    if(err){
      return console.log(err.message);
    }
    console.log(name+" "+surname);

    res.redirect('/knowledge');
  });
});

//End of Qualifications

app.get('/edit_team', (req, res) => {
  sql = 'SELECT Team_Name FROM Teams';
  db.all(sql, [], (err ,rows) => {
    if(err){
      return console.log(err.message);
    }

    res.render('edit_team.ejs', { model:rows });
  });
});

var del;

app.post('/edit_team', (req, res) => {
  del = req.body.team_delete;
  console.log(del);
  sql = 'DELETE FROM Teams WHERE Team_ID = (SELECT Team_ID FROM Teams WHERE Team_Name = '+'"'+String(del)+'"'+')';
  sql1 = 'DELETE FROM Users WHERE ID = (SELECT ID FROM Users WHERE Team_Name = '+'"'+String(del)+'"'+')';
  console.log(sql);
  db.run(sql, [], (err) => {
    if(err){
      return console.log(err.message);
    }

    db.run(sql1, [], (err) => {
      if(err){
        return console.log(err.message);
      }
    })
  });
  res.redirect("/");    
});

//Assessment

// Knowledge


app.get('/knowledge', (req, res) => {

  const sql = "SELECT Question, Reg_ID FROM Questions WHERE Job_Id = (SELECT Job_Id FROM Jobs WHERE Job_Name = "+"'" +job+ "'" +" ) AND KSA = 'K' ORDER BY RANDOM() LIMIT 5";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    //console.log(rows);
    know_rows = rows;
    res.render("knowledge.ejs", { model: rows });
  });

});

app.post('/knowledge', (req, res) => {
  know = req.body;
  res.redirect('/skills');
});

// Skills

app.get('/skills', (req, res) => {

  const sql = "SELECT Question, Reg_ID FROM Questions WHERE Job_Id = (SELECT Job_Id FROM Jobs WHERE Job_Name = "+"'" +job+ "'" +" ) AND KSA = 'S' ORDER BY RANDOM() LIMIT 5";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    //console.log(rows);
    skill_rows = rows;
    res.render("skills.ejs", { model: rows });
  });
});

app.post('/skills', (req, res) => {
  skill = req.body;
  res.redirect('/ability');
})

// Abilities

app.get('/ability', (req, res) => {

  const sql = "SELECT Question, Reg_ID FROM Questions WHERE Job_Id = (SELECT Job_Id FROM Jobs WHERE Job_Name = "+"'" +job+ "'" +" ) AND KSA = 'A' ORDER BY RANDOM() LIMIT 5";
  db.all(sql, [], (err, rows) => {
    if (err) {
      return console.error(err.message);
    }
    ability_rows = rows;
    res.render("ability.ejs", { model: rows });
  });
});

app.post('/ability', (req, res) => {
  ability = req.body;
  res.redirect('/saving_data');
});

// Calculating the KSA percentages 

let skill_array = [];
let abi_array = [];
let know_array = [];
let sum = 0;
let abi_sum = 0;
let know_sum = 0;
let skill_sum = 0;
var know_score = 0;
var abi_score = 0;
var skill_score = 0;

//SUM
function getArraySum(a){
  var total=0;
  for(var i in a) { 
      total += a[i];
  }
  return total;
}

app.get('/saving_data', (req, res) => {

  console.log(ability_rows[0].Reg_ID);

  for (ob in skill){
    skill_array.push(Number(skill[ob.toString()]));
  }
  for(ob in ability){
    abi_array.push(Number(ability[ob.toString()]));
  }
  var know_q_no = 0;
  for(ob in know){
    know_q_no = know_q_no + 1;
    know_array.push(Number(know[ob.toString()]));
  }


  let know_sum = getArraySum(know_array);
  let abi_sum = getArraySum(abi_array);
  let skill_sum = getArraySum(skill_array);
  // Score Json

know_score1 = Number((know_sum)/(know_array.length * 10)*100);
abi_score1 = Number((abi_sum)/(abi_array.length * 10)*100);
skill_score1 = Number((skill_sum)/(skill_array.length * 10)*100);
 

know_score = know_score1.toPrecision(2);
abi_score = abi_score1.toPrecision(2);
skill_score = skill_score1.toPrecision(2);

db.run(`INSERT INTO Answers(Name, K_score, S_score, A_score, Date) VALUES(?, ?, ?, ?, datetime("now","localtime"))`, [name+" "+surname, know_score, skill_score, abi_score], function(err) {
  if (err) {
    return console.log(err.message);
  }else{
    console.log("Insert successful!");
  }

});

res.redirect('/results');

});

var skill_reg;
var know_reg;
var ability_reg;

function GetReg(a){
  let b=[];
  for(let i = 0; i < a.length; i++){
    b.push(a[i].Reg_ID);
  }

  return b;
}



function Score(reg, ksa){
  var reg_count = [];
  var reg_score = [];
  var reg_avg = [];
  var tracker = [];
  for (let i = 0; i < reg.length; i++) {
    num = 1;
    reg_count = [];
    reg_avg = [];
    reg_avg.push(ksa[i]);
    for (let j = i+1; j < reg.length; j++) {
        if (reg[i] == reg[j]) {
          num = num + 1;
          reg_avg.push(ksa[j]);
                       }     
                                          }
    reg_count.push(num);
    if (tracker.includes(reg[i]) == false) {
      tracker.push(reg[i]);
      //console.log("Focus ",reg[i]);
      /*for (let index = 0; index < reg_avg.length; index++) {
        console.log("Average",reg_avg[index]);
        
      }*/
      //console.log("Sum of array",getArraySum(reg_avg));
      reg_avg = Number(((getArraySum(reg_avg))/(reg_avg.length)*10));
      //console.log("Sum Average: ",reg_avg);
      reg_score.push(Number(reg_avg.toPrecision(2)));
        }
                                        }
  

  /*console.log("Reg Score:");
  for (let index = 0; index < reg_score.length; index++) {
    console.log(reg_score[index]);
    
  }
  console.log("Tracker:");
  for (let index = 0; index < tracker.length; index++) {
    console.log(tracker[index]);
    
  }*/

  return [tracker, reg_score];
                        }

function FinalResults(KT, ST, AT, KR, SR, AR){
  KT = KT.concat(ST);
  let Tracker_master = KT.concat(AT);
  KR = KR.concat(SR);
  let Avg = KR.concat(AR);

  var reg_score = [];
  var reg_avg = [];
  var tracker = [];
  for (let i = 0; i < Tracker_master.length; i++) {
    reg_avg = [];
    reg_avg.push(Avg[i]);
    for (let j = i+1; j < Tracker_master.length; j++) {
        if (Tracker_master[i] == Tracker_master[j]) {
          num = num + 1;
          reg_avg.push(Avg[j]);
                       }     
                                          }
    if (tracker.includes(Tracker_master[i]) == false) {
      tracker.push(Tracker_master[i]);
      //console.log("Focus ",reg[i]);
      /*for (let index = 0; index < reg_avg.length; index++) {
        console.log("Average",reg_avg[index]);
        
      }*/
      //console.log("Sum of array",getArraySum(reg_avg));
      reg_avg = Number(((getArraySum(reg_avg))/(reg_avg.length)));
      //console.log("Sum Average: ",reg_avg);
      reg_score.push(Number(reg_avg.toPrecision(2)));
        }
                                        }
  

  console.log("Reg Score:");
  for (let index = 0; index < reg_score.length; index++) {
    console.log(reg_score[index]);
    
  }
  console.log("Tracker:");
  for (let index = 0; index < tracker.length; index++) {
    console.log(tracker[index]);
    
  }

  return [tracker, reg_score];
}

app.get('/results', (req, res) => {

  skill_reg = GetReg(skill_rows);
  know_reg = GetReg(know_rows);
  ability_reg = GetReg(ability_rows);

  console.log('Skill reg list:')
  for (let index = 0; index < skill_array.length; index++) {
    console.log(skill_array[index]);
    
  }
  /*console.log("Skill----------------------------------------------------------");
  let skill_total = Score(skill_reg, skill_array);
  console.log("Knowledge------------------------------------------------------");
  let know_total = Score(know_reg, know_array);
  console.log("Ability--------------------------------------------------------");
  let abi_total = Score(ability_reg, abi_array);
*/
  let K = Score(know_reg, know_array);
  let S = Score(skill_reg, skill_array);
  let A = Score(ability_reg, abi_array);
  let KT = K[0];
  let KR = K[1];
  let ST = S[0];
  let SR = S[1];
  let AT = A[0];
  let AR = A[1];
  let overall = FinalResults(KT, ST, AT, KR, SR, AR);
  for (let index = 0; index < FinalResults[1].length; index++) {
    console(FinalResults[1][index]);
    
  }

  res.render('results.ejs');
});

//Team



//End of team


//

function Team_Average(score_array){}; 

var server = app.listen(3000, function() {
    console.log("Server is up.")
});
