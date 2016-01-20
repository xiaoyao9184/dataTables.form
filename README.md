#Form
The Form extension for DataTables provides a common set of options to postback form data with DataTables paging.




#Installation
Just download from GitHub.




#Basic usage

Form is initialised using the form option in the DataTables constructor, giving an array jquery selectors string of the Widgets (may include Form) or just one Form, that value should postback with DataTables searching information to server. Further options can be specified using this option as an object. For example:


#####Just a Form
( just serialize Form's all element data extend to DataTables's ajax data)
```js
$(document).ready( function () {
    $('#example').DataTable( {
    	form: '#form1'
    } );
} );
```

#####Array
( include a Form selectors will use this Form's action and method attributes to set DataTables's ajax option, and only serialize selected Widgets's data to DataTables's ajax data )
```js
$(document).ready( function () {
    $('#example').DataTable( {
    	form: [
        	'#id1',
            '#id2',
            '#id31,#id32,#id33',
            '#form1'
        ]
    } );
} );
```

#####Object
( postback use this key as name not use element's name attributes )
```js
$(document).ready( function () {
    $('#example').DataTable( {
    	form: [
        	{ name1: '#id1'},
            { name2: '#id2'},
            { name3: '#id31,#id32,#id33'},
            '#form1'
        ]
    } );
} );
```




#Documentation / support
Will be prepared in the future