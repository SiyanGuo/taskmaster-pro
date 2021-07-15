var tasks = {};

//show task on the page
var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  //check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

//add due date audits
var auditTask = function(taskEl) {
  // A HTML created in JS, all attr & func about this <li> will show as property; the entire <li> is []
  //get date from taskEL
  var date = $(taskEl).find("span").text().trim();
  console.log(date);

  //convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);
  //this should print out an object for the value of the date variable, but at 5pm of that date
  console.log(time);

  //remove any old classes from element
  // $(taskEl).removeClass("list-group-item-warning list-group-item-danger")

  //apply new class if task is near/over due date
  if (moment().isAfter(time)){
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2){
    $(taskEl).addClass("list-group-item-warning");
  }
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

//1.1 - edit tasks when clicked
$(".list-group").on("click", "p", function () {
  //get current text
  var text = $(this)
    .text()
    .trim();

  //create new input element
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  //swap out elements
  $(this)
    .replaceWith(textInput);

  //automatically focus on new element
  textInput.trigger("focus");
})

//1.1 -save when <textarea> goes out of focus
$(".list-group").on("blur", "textarea", function () {
  //get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();

  //get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  //get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  //update and save the new task
  tasks[status][index].text = text;
  saveTasks();

  //recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  //replace textarea with p element
  $(this).replaceWith(taskP);

})

//1.2 - edit due dates when clicked
$(".list-group").on("click", "span", function () {
  var date = $(this).text().trim();
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  $(this).replaceWith(dateInput);

  //enable jquery ui datepicker
  dateInput.datepicker({
    // minDate: 1,
    onClose: function () {
      //when calendar is closed, force a "change" event on dateInput
      $(this).trigger("change")
    }
  });

  //automatically bring up the calendar
  dateInput.trigger("focus");
})

//1.2 - save new dates when blur event occurs 
//4.1 - change blur to change once implemented datepicker
$(".list-group").on("change", "input[type='text']", function () {
  var date = $(this).val().trim();
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  var index = $(this)
    .closest(".list-group-item")
    .index();

  tasks[status][index].date = date;
  saveTasks();

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  $(this).replaceWith(taskSpan);

  //pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
})

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// get and push task(obj) into tasks(arr) when save button in modal was clicked; 
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// add sortable to <ul>
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag")
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag")

  },
  over: function (event) {
    console.log("over", event.target);
    $(event.target).addClass("dropover-active")
  },
  out: function (event) {
    console.log("out", event.target);
    $(event.target).removeClass("dropover-active")
  },
  update: function (event) {
    //array to store the task data in
    var tempArr = [];

    //loop over current set of children in sortable list
    $(this).children().each(function () {
      var text = $(this)
        .find("p")
        .text()
        .trim();

      var date = $(this)
        .find("span")
        .text()
        .trim();

      //add task data to the temp array as an object
      tempArr.push({
        text: text,
        date: date
      });
    });

    //trim down list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-", "");

      console.log("arrName", arrName);

    //update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

// add droppable 
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerence: "touch",
  drop: function (event, ui) {
    console.log("drop");
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active")

  },
  over: function (event, ui) {
    console.log("over");
    $(".bottom-trash").addClass("bottom-trash-active")

  },
  out: function (event, ui) {
    console.log("out");
    $(".bottom-trash").removeClass("bottom-trash-active")

  }
});

//add date picker
$("#modalDueDate").datepicker({
  // minDate: 1
});

// run auditTask() every 30mins
setInterval(function(){
$(".card .list-group-item").each(function(index, el){
  auditTask(el);
});
}, (1000*60)*30);