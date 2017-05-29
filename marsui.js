"use strict";

var comms_error = true;
var user_command_list = [];

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
  if (testCommands()) {
    executeCommands();
  }
}

function executeCommands() {
  disableSubmit();
  disableCommands();
  var textarea = document.getElementById("commands");
  var lines = textarea.value.split("\n");
  var numLines = lines.length;
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

function testCommands() {
  var goodCommands = true;
  var textarea = document.getElementById("commands");
  var lines = textarea.value.split("\n");
  var numLines = lines.length;
  if (numLines > 1 && lines[numLines - 1].length === 0) {
    numLines--; // ignore last command line if it is zero length
  }
  for (var i = 0; i < numLines; i++) {
    if (lines[i].indexOf("forward ") === 0 || lines[i].indexOf("backward ") === 0 || lines[i].indexOf("left ") === 0 || lines[i].indexOf("right ") === 0) {
      user_command_list[i] = lines[i].split(" ");
      if (isInt(user_command_list[i][1])) {
        if (user_command_list[i][1] < 1 || user_command_list[i][1] > 5) {
          $("#response").append("Error line " + (i + 1) + " value out of range (must be 1, 2, 3, 4 or 5)<br />");
          goodCommands = false;
        }
      } else {
        $("#response").append("Error line " + (i + 1) + " value is not an integer<br />");
        goodCommands = false;
      }
    } else {
      $("#response").append("Syntax error line " + (i + 1) + "<br />");
      goodCommands = false;
    }
  }
  return (goodCommands);
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
