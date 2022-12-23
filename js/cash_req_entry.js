function addValue(frm,childTable,column){
    frm.doc[childTable].reduce(function(acc,i){
        return acc + i[column];
    })
}
