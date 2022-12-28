
function addValue(frm,childTable,column){
    return frm.doc[childTable].reduce(function(acc,i){
        return acc + i[column];
    },0);
}
function sumTotalValue(){
    cur_frm.set_value('total_requested_amount',cur_frm.doc.total_labour_bill_amount + cur_frm.doc.total_requested_advance);
    cur_frm.set_value('total_approved_amount',cur_frm.doc.approved_labour_bill_amount + cur_frm.doc.total_approved_advance);
}
frappe.ui.form.on('Cash Requisition Entry', {
setup: function(frm,doc){
          cur_frm.set_query("bill_type", function(doc){
            return{
                "filters":{
                    "name": ["in",["Muster Role Entry",'F And F Entry','Rate Work Entry','Purchase Invoice']],
                }
            };
        });
},
request_date: function(frm,doc){
    if(frm.doc.request_date){
        frappe.db.get_value('Accounting Period', {'start_date': ['<=',cur_frm.doc.request_date],'end_date':['>=',cur_frm.doc.request_date],'company':cur_frm.doc.company},['name']).then(r=> cur_frm.set_value('accounting_period',r.message.name));
    }
},
update_details: function(frm,doc){

    frappe.db.get_value('Accounting Period',cur_frm.doc.accounting_period,['start_date','end_date']).then(r=>{
        let filters={
    'project':cur_frm.doc.project,
    'company':cur_frm.doc.company,
    'startDate':'',
    'endDate':'',
};
     let  billTypeList=cur_frm.doc.bill_type.map(i=>i.bill_type);
    filters.startDate=r.message.start_date;
    filters.endDate=r.message.end_date;
     frappe.xcall("construction.construction.doctype.cash_requisition_entry.cash_requisition_entry.getBillList",{"billTypeList":billTypeList,"filters":filters}).then(f=>{
      let list = f.flatMap( i => i); console.log(list);
      cur_frm.set_value('cash_requisition_details',null);
      list.forEach(x => {
          let item=cur_frm.add_child("cash_requisition_details");
          item.document_name = x.name;
          item.document_date = x.posting_date;
          item.bill_amount = x.total_amount || x.rounded_total;
          item.advance_paid = x.advance_paid || x.nx_advance_paid;
          item.request_amount = (x.total_amount || x.rounded_total || 0) - (x.advance_paid || x.nx_advance_paid || 0);
          item.muster_roll = x.muster_role || '';
          item.party_type = "Supplier" || '';
          item.party = x.subcontractor || x.supplier || '';
          item.payment_request_type = x.doctype;
          cur_frm.refresh_field('cash_requisition_details');
          cur_frm.set_value('total_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','request_amount'));
      });
      
      });
    
});
    
     
}
    
});

frappe.ui.form.on('Cash Requisition Detail', {

		// your code here
    	request_amount: function(){
    	    cur_frm.set_value('total_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','request_amount'));
    	    cur_frm.set_value('approved_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','approved_amount'));
    	    sumTotalValue();
    	},
    	approved_amount: function(){
    	    cur_frm.set_value('total_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','request_amount'));
    	    cur_frm.set_value('approved_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','approved_amount'));
    	    sumTotalValue();
    	},
    	cash_requisition_details_remove: function(){
    	    cur_frm.set_value('total_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','request_amount'));
    	    cur_frm.set_value('approved_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','approved_amount'));
    	    sumTotalValue();
    	},	
    	cash_requisition_details_add: function(){
    	    cur_frm.set_value('total_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','request_amount'));
    	    cur_frm.set_value('approved_labour_bill_amount',addValue(cur_frm,'cash_requisition_details','approved_amount'));
    	    sumTotalValue();
    	}
    	
});


frappe.ui.form.on('Other Payments and Advances', {
	
		// your code here
		request_amount: function(){
    	    cur_frm.set_value('total_requested_advance',addValue(cur_frm,'other_payments_and_advances','request_amount'));
    	    cur_frm.set_value('total_approved_advance',addValue(cur_frm,'other_payments_and_advances','approved_amount'));
    	    sumTotalValue();
    	},
    	approved_amount: function(){
    	    cur_frm.set_value('total_requested_advance',addValue(cur_frm,'other_payments_and_advances','request_amount'));
    	    cur_frm.set_value('total_approved_advance',addValue(cur_frm,'other_payments_and_advances','approved_amount'));
    	    sumTotalValue();
    	},
    	other_payments_and_advances_remove: function(){
    	    cur_frm.set_value('total_requested_advance',addValue(cur_frm,'other_payments_and_advances','request_amount'));
    	    cur_frm.set_value('total_approved_advance',addValue(cur_frm,'other_payments_and_advances','approved_amount'));
    	    sumTotalValue();
    	},	
    	other_payments_and_advances_add: function(){
    	    cur_frm.set_value('total_requested_advance',addValue(cur_frm,'other_payments_and_advances','request_amount'));
    	    cur_frm.set_value('total_approved_advance',addValue(cur_frm,'other_payments_and_advances','approved_amount'));
    	    sumTotalValue();
    	}
	
});