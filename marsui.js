"use strict";

var comms_error = true;

var updateVoltage = setInterval(function() {
  getVoltage();
}, 1000);

function getVoltage() {
  $.getJSON("/voltage/", function(jsonData) {
      $("#voltage").html("Battery voltage: " + jsonData[0].value.toFixed(3) + " Volts");
      if (jsonData[0].value > 11) {
        $("#voltage").css("backgroundColor", "Green");
      } else if (jsonData[0].value > 10) {
        $("#voltage").css("backgroundColor", "Orange");
      } else {
        $("#voltage").css("backgroundColor", "Red");
      }
      if (comms_error) { // comms restored but comms_error is true so do this lot once
        $("#cameraView").show();
        $("#cameraView").attr("src", "stream.mjpg");
        $("#static").hide();
        $("#response").html("Type your commands in the window above and click Submit<br />");
        $("#commands").css("color", "Green");
        $("#submit").css("backgroundColor", "Green");
        $("#submit").css("color", "White");
      }
      comms_error = false;
    })
    .fail(function() {
      comms_error = true;
      $("#submit").css("backgroundColor", "Orange");
      $("#commands").css("color", "Red");
      $("#static").show();
      $("#cameraView").hide();
      $("#cameraView").attr("src", "");
      $("#response").html("Communuction Error. Cannot submit commands at this time");
    });
}

function clearCommands() {
  $("#commands").val("");
  if (comms_error) {
    $("#response").html("Communuction Error. Cannot submit commands at this time");
  } else {
    $("#response").html("Type your commands in the window above and click Submit<br />");
  }
}

function submitCommands() {
  if (comms_error) {
    return;
  }
  $("#response").html("Type your commands in the window above and click Submit<br />");
  if (validateCommands()) {
    executeCommands();
  }
}

function executeCommands() {
  disableSubmit();
  disableCommands();
  var textarea = document.getElementById("commands");
  var lines = textarea.value.split("\n");
  var numLines = lines.length;
  var user_command_list = getUserCommandList();
  if (numLines > 1 && lines[numLines - 1].length === 0) {
    numLines--; // ignore last command line if it is zero length
  }
  if (numLines > 0) {
    $("#response").append("Executing commands<br />");
    $.ajax({
        url: user_command_list[0][0] + "/" + user_command_list[0][1] + "/",
        success: function(result) {
          $("#response").append("Command line 1 " + result + "<br />");
          if (numLines == 1) {
            enableSubmit();
            enableCommands();
          }
          if (numLines > 1) {
            $.ajax({
                url: user_command_list[1][0] + "/" + user_command_list[1][1] + "/",
                success: function(result) {
                  $("#response").append("Command line 2 " + result + "<br />");
                  if (numLines == 2) {
                    enableSubmit();
                    enableCommands();
                  }
                  if (numLines > 2) {
                    $.ajax({
                        url: user_command_list[2][0] + "/" + user_command_list[2][1] + "/",
                        success: function(result) {
                          $("#response").append("Command line 3 " + result + "<br />");
                          if (numLines == 3) {
                            enableSubmit();
                            enableCommands();
                          }
                          if (numLines > 3) {
                            $.ajax({
                                url: user_command_list[3][0] + "/" + user_command_list[3][1] + "/",
                                success: function(result) {
                                  $("#response").append("Command line 4 " + result + "<br />");
                                  enableSubmit();
                                  enableCommands();
                                }
                              })
                              .fail(function() {
                                $("#response").append("No response from rover<br />");
                                enableSubmit();
                                enableCommands();
                              });
                          }
                        }
                      })
                      .fail(function() {
                        $("#response").append("No response from rover<br />");
                        enableSubmit();
                        enableCommands();
                      });
                  }
                }
              })
              .fail(function() {
                $("#response").append("No response from rover<br />");
                enableSubmit();
                enableCommands();
              });
          }
        }
      })
      .fail(function() {
        $("#response").append("No response from rover<br />");
        enableSubmit();
        enableCommands();
      });
  }
}

function getUserCommandList() {
  var user_command_list = [];
  var textarea = document.getElementById("commands");
  var lines = textarea.value.split("\n");
  var numLines = lines.length;

  if (numLines > 1 && lines[numLines - 1].length === 0) {
    numLines--; // ignore last command line if it is zero length
  }

  for (var i = 0; i < numLines; i++) {
      user_command_list[i] = lines[i].split(" ");
  }
  return user_command_list;
}


function validateCommands() {
  // valid_command_list = [["command", lower_argument, upper_argument, "units"]]
  var valid_command_list = [["forward",  1, 5,   "lengths"],
                            ["backward", 1, 5,   "lengths"],
                            ["right",    0, 180, "degrees"],
                            ["left",     0, 180, "degrees"]];

  var user_command_list = getUserCommandList();
  var num_user_commands = user_command_list.length;
  var bad_command = false;
  var i, j;

  // Test 1 - check each array entry is length 2 (command, argument)
  for (i = 0; i < num_user_commands; i++) {
    if (user_command_list[i].length != 2) {
      $("#response").append("Syntax error in line " + (i + 1) + "<br />");
      return false;
    }
  }

  // Test 2 - check that the first element of each array entry is a valid command
  for (i = 0; i < num_user_commands; i++) {
    for (j = 0; j < valid_command_list.length; j++) {
      if (user_command_list[i][0] !== valid_command_list[j][0]) {
        bad_command = true;
      } else {
        bad_command = false;
        break;
      }
    }
    if (bad_command) {
      $("#response").append("Syntax error in line " + (i + 1) + "<br />");
      return false;
    }
  }

  // Test 3 - check that each command argument is an integer
  for (i = 0; i < num_user_commands; i++) {
    if (!isInt(user_command_list[i][1])) {
      $("#response").append("Error in line " + (i + 1) + ", value is not an integer<br />");
      return false;
    }
  }

  // Test 4 - check that each command argument is within the command range
  for (i = 0; i < num_user_commands; i++) {
    for (j = 0; j < valid_command_list.length; j++) {
      if (user_command_list[i][0] === valid_command_list[j][0]) {
        if (user_command_list[i][1] < valid_command_list[j][1] || user_command_list[i][1] > valid_command_list[j][2]) {
          $("#response").append("Error in line " + (i + 1) +
                                ", value out of range (must be from " +
                                valid_command_list[j][1] + " to " +
                                valid_command_list[j][2] + " " +
                                valid_command_list[j][3] + ")<br />");
          return false;
        }
      }
    }
  }

  // Passed all tests
  return true;
}

$(document).ready(function() {
  document.getElementById("commands").onkeyup = function() {
    var limit = 4; // <---max no of lines you want in textarea
    var textarea = document.getElementById("commands");
    var spaces = textarea.getAttribute("cols");
    var lines = textarea.value.split("\n");

    for (var i = 0; i < lines.length; i++) {
      if (lines[i].length <= spaces) {
        continue;
      }
      var j = 0;
      var space = spaces;
      while (j++ <= spaces) {
        if (lines[i].charAt(j) === " ") {
          space = j;
        }
      }
      lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || "");
      lines[i] = lines[i].substring(0, space);
    }
    if (lines.length > limit) {
      textarea.style.color = "red";
      setTimeout(function() {
        if (comms_error) {
          textarea.style.color = "red";
        } else {
          textarea.style.color = "green";
        }
      }, 500);
    }
    textarea.value = lines.slice(0, limit).join("\n");
  };
})

function isInt(value) {
  return !isNaN(value) && (function(x) {
    return (x | 0) === x;
  })(parseFloat(value))
}

function enableSubmit() {
  $("#submit").attr("disabled", false);
  $("#submit").css("backgroundColor", "Green");
}

function disableSubmit() {
  $("#submit").attr("disabled", true);
  $("#submit").css("backgroundColor", "Orange");
}

function enableCommands() {
  $("#commands").attr("disabled", false);
}

function disableCommands() {
  $("#commands").attr("disabled", true);
}
