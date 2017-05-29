"use strict"

var commsError = true;
var commands = [];

var updateVoltage = setInterval(function() {
  getVoltage()
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
      if (commsError) { // comms restored but commsError is true so do this lot once
        $("#cameraView").show();
        $("#cameraView").attr("src", "stream.mjpg");
        $("#static").hide();
        $("#response").html("Type your commands in the window above and click Submit<br />");
        $("#commands").css("color", "Green");
        $("#submit").css("backgroundColor", "Green");
        $("#submit").css("color", "White");
      }
      commsError = false;
    })
    .fail(function() {
      commsError = true;
      $("#submit").css("backgroundColor", "Orange");
      $("#commands").css("color", "Red");
      $("#static").show();
      $("#cameraView").hide();
      $("#cameraView").attr("src", "");
      $("#response").html("Communuction Error. Cannot submit commands at this time");
    });
}

function clearCommands() {
  $("#commands").val('');
  if (commsError) {
    $("#response").html("Communuction Error. Cannot submit commands at this time");
  } else {
    $("#response").html("Type your commands in the window above and click Submit<br />");
  }
}

function submitCommands() {
  if (commsError) {
    return;
  }
  $("#response").html("Type your commands in the window above and click Submit<br />");
  if (testCommands()) {
    executeCommands();
  }
}

function executeCommands() {
  disableSubmit();
  var textarea = document.getElementById("commands");
  var lines = textarea.value.split("\n");
  var numLines = lines.length;
  if (numLines > 1 && lines[numLines - 1].length === 0) {
    numLines--; // ignore last command line if it is zero length
  }
  if (numLines > 0) {
    $("#response").append("Executing commands<br />");
    $.ajax({
        url: commands[0][0] + "/" + commands[0][1] + "/",
        success: function(result) {
          $("#response").append("Command line 1 " + result + "<br />");
          if (numLines == 1) {
            enableSubmit();
          }
          if (numLines > 1) {
            $.ajax({
                url: commands[1][0] + "/" + commands[1][1] + "/",
                success: function(result) {
                  $("#response").append("Command line 2 " + result + "<br />");
                  if (numLines == 2) {
                    enableSubmit();
                  }
                  if (numLines > 2) {
                    $.ajax({
                        url: commands[2][0] + "/" + commands[2][1] + "/",
                        success: function(result) {
                          $("#response").append("Command line 3 " + result + "<br />");
                          if (numLines == 3) {
                            enableSubmit();
                          }
                          if (numLines > 3) {
                            $.ajax({
                                url: commands[3][0] + "/" + commands[3][1] + "/",
                                success: function(result) {
                                  $("#response").append("Command line 4 " + result + "<br />");
                                  enableSubmit();
                                }
                              })
                              .fail(function() {
                                $("#response").append("No response from rover<br />");
                                enableSubmit();
                              });
                          }
                        }
                      })
                      .fail(function() {
                        $("#response").append("No response from rover<br />");
                        enableSubmit();
                      });
                  }
                }
              })
              .fail(function() {
                $("#response").append("No response from rover<br />");
                enableSubmit();
              });
          }
        }
      })
      .fail(function() {
        $("#response").append("No response from rover<br />");
        enableSubmit();
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
      commands[i] = lines[i].split(" ");
      if (isInt(commands[i][1])) {
        if (commands[i][1] < 1 || commands[i][1] > 5) {
          $("#response").append("Error line " + (i + 1) + " value out of range (must be 1, 2, 3, 4 or 5)<br />")
          goodCommands = false;
        }
      } else {
        $("#response").append("Error line " + (i + 1) + " value is not an integer<br />")
        goodCommands = false;
      }
    } else {
      $("#response").append("Syntax error line " + (i + 1) + "<br />")
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
      if (lines[i].length <= spaces) continue;
      var j = 0;
      var space = spaces;
      while (j++ <= spaces) {
        if (lines[i].charAt(j) === " ") space = j;
      }
      lines[i + 1] = lines[i].substring(space + 1) + (lines[i + 1] || "");
      lines[i] = lines[i].substring(0, space);
    }
    if (lines.length > limit) {
      textarea.style.color = 'red';
      setTimeout(function() {
        if (commsError) {
          textarea.style.color = 'red';
        } else {
          textarea.style.color = 'green';
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
  enableCommands();
}

function disableSubmit() {
  $("#submit").attr("disabled", true);
  $("#submit").css("backgroundColor", "Orange");
  disableCommands();
}

function enableCommands() {
  $("#commands").attr("disabled", false);
}

function disableCommands() {
  $("#commands").attr("disabled", true);
}
