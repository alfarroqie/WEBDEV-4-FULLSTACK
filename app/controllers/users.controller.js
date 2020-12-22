const db = require("../models");
const authConfig = require("../configs/auth.config.js");
const User = db.users;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Op = db.Sequelize.Op;

// Create and Save a new User
exports.create = async (req, res) => {
try {
      // Validate request
      if (!req.body.username || !req.body.password ||req.body.isAdmin===undefined) {
        res.status(400).send({
          message: "Username, password, isAdmin can not be empty!"
        });
        return;
      }
    
      // Create a User
      const user = {
        name: req.body.name,
        email: req.body.email,
        username: req.body.username,
        password: req.body.password,
        isAdmin : req.body.isAdmin,
      };
      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(user.password, salt);
      user.password = hash;
      // Save User in the database
      User.create(user)
        .then(data => {
          res.send(data);
        })
        .catch(err => {
          res.status(500).send({
            message:
              err.message || "Some error occurred while creating the User."
          });
        });
}
catch(err){
  res.status(500).send({
    message : "UNKNOW ERROR"
  })
}
};

// Retrieve all User from the database.
exports.findAll = (req, res) => {
  User.findAll()
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while retrieving User."
      });
    });
};

// Find a single User with id
exports.findOne = (req, res) => {
  const id = req.params.id;

  User.findByPk(id)
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: "Error retrieving User with id" + id
      });
    });
};

// Update a User by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  User.update(req.body, {
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "User updated !"
        });
      } else {
        res.send({
          message: `Cannot update User with id=${id}. Maybe User was not found or req.body is empty!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Error updating User with id=" + id
      });
    });
};

// Delete a User with the specified id in the request
exports.delete = (req, res) => {
  const id = req.userId

  User.destroy({
    where: { id: id }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "User deleted!"
        });
      } else {
        res.send({
          message: `Cannot delete User with id=${id}. Maybe User was not found!`
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Could not delete User with id=" + id
      });
    });
};

exports.login = async (req, res) => {
try{
  const sign = {
    email = req.body.email,
    password = req.body.password
  };
  const user = await User.findOne({
    where: { email: email }
  });
  if(user){
    const isPasswordTrue = await bcrypt.compare(password, user.password);
    if(!isPasswordTrue){
      const error = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }

  } else{
    const error = new Error("User Not Found");
    error.statusCode = 401;
    throw error;
  }
 const token = jwt.sign({
   id : user.id,
   isAdmin : user.isAdmin,
 },
 authConfig.accessSecret,
 {expiresIn :user.isAdmin? authConfig.adminTimeout:authConfig.userTimeout}
 );
  res.status(200).send({
    message: "Token berhasil dibuat", token : token
  });
} 
catch(err){
  res.status(err.statusCode).send({
    message: err.message
  });
}
}

exports.changePassword = async (req, res) => {
  try{
    const newPassword = req.body.newPassword
    const id = req.userId
    const user = await User.findByPk(id)
    if(user){
      let salt = await bcrypt.genSalt(10);
      let hash = await bcrypt.hash(newPassword, salt);
      user.password = hash
      await user.save()
      res.status(200).send({
        message : "Ubah password berhasil"
      })
    }
    else{
      const error = new Error("User Not Found");
      error.statusCode = 401;
      throw error;
    }
  }
  catch(err){
  res.status(err.status).send({
    message: err.message
  }); 
}
}