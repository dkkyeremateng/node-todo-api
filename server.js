var bodyParser = require('body-parser'),
    _          = require('underscore'),
    db         = require('./db'),
    express    = require('express'),
    bcrypt     = require('bcrypt');

var app = express();

var PORT = process.env.PORT || 3000;

// app config
app.use(bodyParser.json());

// Routes
app.get('/', function(req, res) {

    res.send("Todo api root");
});

app.get('/todos/', function(req, res) {
    var queryParams = req.query;
    var where = {};

    if (queryParams.hasOwnProperty("completed") && queryParams.completed === "true") {
        where.completed = true;
    } else if (queryParams.hasOwnProperty("completed") && queryParams.completed === "false") {
        where.completed = false;
    }

    if (queryParams.hasOwnProperty("q") && queryParams.q.length > 0) {
        where.description = {
            $like: "%" + queryParams.q + "%"
        };
    }

    db.todo.findAll({where: where}).then(function (todos) {
        res.json({todos: todos});
    }).catch(function (err) {
        res.status(500).send();
    });
});

app.get('/todos/:id', function(req, res) {
    var id = parseInt(req.params.id, 10);

    db.todo.findById(id).then(function (todo) {
        if (!todo) {
            res.status(404).send("No todo found with that id");
        } else {
            res.status(200).json({todos: [todo]});
        }
    }).catch(function (err) {
        res.status(500).send(err);
    });
});

app.post('/todos/', function(req, res) {
    var body = _.pick(req.body, "completed", "description");

    if (body.hasOwnProperty("completed")) {
        if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0) {
            return res.status(400).send();
        }
    } else if (!_.isString(body.description) || body.description.trim().length === 0) {
        return res.status(400).send();
    }

    db.todo.create(body).then(function (todo) {
        res.status(200).json(todo);
    }).catch(function (err) {
        res.status(400).send(err);
    });
});

app.delete('/todos/:id', function (req, res) {
    var id = parseInt(req.params.id, 10);

    db.todo.findById(id).then(function (todo) {
        if (!todo) {
            return res.status(404).json({error: "No todo found with that id"});
        } else {
            return todo.destroy();
        }
    }).then(function (todo) {
        res.json(todo);
    }).catch(function (err) {
        return res.status(500).send();
    });
});

app.put('/todos/:id', function (req, res) {
    var id = parseInt(req.params.id, 10);
    var body = _.pick(req.body, "completed", "description");
    var attributes = {};

    if (body.hasOwnProperty("completed") && _.isBoolean(body.completed)) {
        attributes.completed = body.completed;
    } else if (body.hasOwnProperty("completed")) {
        return res.status(400).send();
    }

    if (body.hasOwnProperty("description") && _.isString(body.description) && body.description.trim().length > 0) {
        attributes.description = body.description;
    } else if (body.hasOwnProperty("description")) {
        return res.status(400).send();
    }

    db.todo.findById(id).then(function (todo) {
        if (!todo) {
            res.status(404).json({error: "No todo found with that id"});
        } else {
            todo.update(attributes).then(function (todo) {
                res.json(todo);
            }, function (err) {
                res.status(400).json(err);
            });
        }
    }, function () {
        res.status(500).send();
    });
});

app.post('/users/', function(req, res) {
    var body = _.pick(req.body, "email", "password");

    if (!_.isString(body.email) || !_.isString(body.password) || body.password.trim().length < 7) {
        return res.status(400).send();
    }

    db.user.create(body).then(function (user) {
        res.status(200).json(user.toPublicJSON());
    }).catch(function (err) {
        res.status(400).send(err);
    });
});

app.post("/users/login", function (req, res) {
    var body = _.pick(req.body, "email", "password");
    var where = {};

    db.user.authenticate(body).then(function (user) {
        res.json(user.toPublicJSON());
    }, function () {
        res.status(401).send();
    });
});

db.sequelize.sync().then(function () {
    app.listen(PORT, function () {
        console.log("Server started on port " + PORT);
    });
});
