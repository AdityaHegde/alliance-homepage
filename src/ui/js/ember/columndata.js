GOTAA.ColumnDataMap = {
  allianceshort : [
    {
      name : "name",
      label : "Name",
      type : "textInput",
      sortable : true,
      searchable : true,
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      maxlength : "100",
    },
    {
      name : "motto",
      label : "Motto",
      type : "textInput",
      sortable : true,
      searchable : true,
      validations : [
      ],
      maxlength : "200",
    },
  ],
  module : [
    {
      name : "title",
      label : "Title",
      type : "textInput",
      sortable : true,
      searchable : true,
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      maxlength : "100",
    },
    {
      name : "type",
      label : "Type",
      type : "staticSelect",
      options : [
        {val : 'simpleList', label : 'Simple List of Data'},
        //{val : 'listInList', label : 'List of Lists'},
        {val : 'challenge', label : 'Challenge'},
        //{val : 'members', label : 'Members'},
        {val : 'feed', label : 'Feed'},
      ],
      sortable : true,
      filterable : true,
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
    },
    {
      name : "col",
      label : "Column",
      type : "staticSelect",
      options : [
        {val : 0, label : 'Left Column'},
        {val : 1, label : 'Center Column'},
        {val : 2, label : 'Right Column'},
      ],
      sortable : true,
      filterable : true,
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
    },
  ],
  simpleList : [
    {
      name : "title",
      label : "Title",
      type : "textInput",
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      sortable : true,
      searchable : true,
    },
    {
      name : "desc",
      label : "Description",
      type : "textInput",
      sortable : true,
      searchable : true,
    },
  ],
  listInList : [
    {
      name : "title",
      label : "Title",
      type : "textInput",
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      sortable : true,
      searchable : true,
    },
  ],
  challenge : [
    {
      name : "title",
      label : "Title",
      type : "textInput",
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      sortable : true,
      searchable : true,
    },
    {
      name : "startsAt",
      label : "Starts At",
      type : "textInput",
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      sortable : true,
      searchable : true,
    },
    {
      name : "status",
      label : "Status",
      type : "staticSelect",
      options : [
        {val : 0, label : 'Yet to start'},
        {val : 1, label : 'Started'},
      ],
      sortable : true,
      filterable : true,
      fromFile : true,
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
    },
  ],
  feed : [
    {
      name : "title",
      label : "Title",
      type : "textInput",
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      sortable : true,
      searchable : true,
    },
    {
      name : "desc",
      label : "Description",
      type : "textInput",
      sortable : true,
      searchable : true,
    },
  ],
  invite : [
    {
      name : "email",
      label : "Email",
      type : "textInput",
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
      sortable : true,
      searchable : true,
    },
    {
      name : "permission",
      label : "Position",
      type : "staticSelect",
      options : [
        {val : "L", label : 'Leader'},
        {val : "O", label : 'Officer'},
        {val : "M", label : 'Member'},
      ],
      sortable : true,
      filterable : true,
      validations : [
        {type : 0, invalidMessage : "Cant be empty"},
      ],
    },
  ],
};
