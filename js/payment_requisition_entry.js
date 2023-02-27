// Copyright (c) 2023, Nxweb and contributors
// For license information, please see license.txt

/*frappe.ui.form.on('Payment Requisition Entry', {
	// refresh: function(frm) {

	// }
});*/

/*
#Parent Filter
1.bill_type
2.project

#Parent Function
1.sumTotalValue()
2.bill_type_filter()
3.request_date()
4.update_details()
5.project_filter()

#Child Table Filter
1.labour_bill_detail(party_type)
2.other_payments_and_advances(party_type)

#Child Table (labour_bill_detail)Function
1.party_type_filter()
2.addValue()
3.request_amount()
4.approved_amount()
5.labour_bill_detail_remove()
6.labour_bill_detail_add()



#Child Table (other_payments_and_advances)Function
1.request_amount()
2.approved_amount()
3.other_payments_and_advances_remove()
4.other_payments_and_advances_add()
5.account_head()

*/

frappe.ui.form.on('Payment Requisition Entry', {
    setup: function(frm, doc) {
        bill_type_filter();
    },
    refresh: function(frm) {
        party_type_filter();
        project_filter();
        payment_request_type_filter();


        if (cur_frm.doc.docstatus === 1) {
            cur_frm.add_custom_button("Payment Entry", () => {}, "Create").addClass("btn-primary");
        }
    },
    request_date: function(frm, doc) {
        if (cur_frm.doc.request_date != undefined){
            apply_accounting_period();
        }else{
            cur_frm.set_value('accounting_period',undefined)
        }
        
    },
    get_labour_bills: function(frm, doc) {
        console.log('TEst')
        frappe.db.get_value('Accounting Period', cur_frm.doc.accounting_period, ['start_date', 'end_date']).then(r => {
            let filters = {
                'project': cur_frm.doc.project,
                'company': cur_frm.doc.company,
                'startDate': '',
                'endDate': '',
            };
            //let billTypeList = cur_frm.doc.bill_type.map(i => i.bill_type);
            filters.startDate = r.message.start_date;
            filters.endDate = r.message.end_date;
            frappe.xcall("construction.construction.doctype.payment_requisition_entry.payment_requisition_entry.getBillList", {
               // "billTypeList": billTypeList,
                "filters": filters
            }).then(f => {
                let list = f.flatMap(i => i);
                console.log(f);
                cur_frm.set_value('labour_bill_detail', null);
                list.forEach(x => {
                    let item = cur_frm.add_child("labour_bill_detail");
                    item.document_name = x.name;
                    item.document_date = x.posting_date;
                    item.bill_amount = x.total_amount || x.rounded_total || x.total_claimed_amount;
                    item.advance_paid = x.advance_paid || x.nx_advance_paid;
                    item.request_amount = (x.total_amount || x.rounded_total || x.total_claimed_amount || 0) - (x.advance_paid || x.nx_advance_paid || 0);
                    item.approved_amount = item.request_amount;
                    item.muster_roll = x.muster_role || '';
                    item.party_type = (x.doctype === 'Expense Claim') ? "employee" : "Supplier";
                    item.party = x.subcontractor || x.supplier || x.employee || '';
                    item.payment_request_type = x.doctype;
                    cur_frm.refresh_field('labour_bill_detail');
                });
                cur_frm.set_value('total_labour_bill_amount', addValue(cur_frm, 'labour_bill_detail', 'request_amount'));
                cur_frm.refresh_field('total_labour_bill_amount');
                cur_frm.refresh_field('approved_labour_bill_amount');
            });
        });
    }
});
function apply_accounting_period() {
    frappe.db.get_value('Accounting Period', {
        'start_date': ['<=', cur_frm.doc.request_date],
        'end_date': ['>=', cur_frm.doc.request_date],
        'company': cur_frm.doc.company
    }, ['name']).then(doc => cur_frm.set_value('accounting_period', doc.message.name));
}
function project_filter(){
    cur_frm.set_query("project",function(){
        return{
            filters:[["Project","status","=","Open"]]
        }
    })
}
function party_type_filter() {
    let doc_name = ["Customer", "Supplier"]
    cur_frm.fields_dict.labour_bill_detail.grid.get_field("party_type").get_query = function() {
        return {
            filters: [
                ['DocType', 'name', 'in', doc_name]
            ]
        }
    }
    cur_frm.fields_dict.other_payments_and_advances.grid.get_field("payment_request_type").get_query = function() {
        return {
            filters: [
                ['DocType', 'name', 'in', doc_name]
            ]
        }
    }

}

function addValue(frm, childTable, column) {
    return frm.doc[childTable].reduce(function(acc, i) {
        return acc + i[column];
    }, 0);
}

function sumTotalValue() {
    cur_frm.set_value('total_requested_amount', cur_frm.doc.total_labour_bill_amount + cur_frm.doc.total_requested_advance);
    cur_frm.set_value('total_approved_amount', cur_frm.doc.approved_labour_bill_amount + cur_frm.doc.total_approved_advance);
}

function bill_type_filter() {
    cur_frm.set_query("bill_type", function(doc) {
        return {
            "filters": {
                "name": ["in", ["Muster Roll Entry", 'Purchase Invoice']],
            }
        };
    })
}

frappe.ui.form.on('Labour Bill Detail', {
    // your code here
    request_amount: function() {
        validate_bill_amt();
    },
    approved_amount: function() {
        validate_bill_amt();
    },
    labour_bill_detail_remove: function() {
       validate_bill_amt();
    },
    labour_bill_detail_add: function() {
        validate_bill_amt();
    },
    /*payment_request_type:function(frm,cdt,cdn){
        validate_payment_req_type(frm,cdt,cdn); 
        
    },*/
    document_name:function(frm,cdt,cdn){
        get_PI_round_tot(frm,cdt,cdn);
        validate_document(frm,cdt,cdn);
        
    },
    /*party:function(frm,cdt,cdn){
        let d=locals[cdt][cdn];
        cur_frm.fields_dict.labour_bill_detail.grid.get_field("document_name").get_query = function() {
        return {
            filters: [
                ['Purchase Invoice','supplier','=',d.party]]
          }
        }

    },*/
    	show_bill_preview: function(frm,cdt,cdn){
    	    let d = locals[cdt][cdn];
    	    const fields =  [{
                         label: 'BILLS',
                         fieldtype: 'Table',
                         fieldname: 'bills',
                         fields: [
                             {
                               fieldtype: 'Data',
                               fieldname: 'bill_type',
                               reqd: 1,
                               label: __('Bill Type'),
                               options:'DocType',
                               in_list_view: 1,
                               hidden: 0
                            },
                             {
                               fieldtype: 'Data',
                               fieldname: 'bill_name',
                               reqd: 1,
                               label: __('Bill Name'),
                               in_list_view: 1,
                            },
                            
                            {
                               fieldtype: 'Button',
                               fieldname: 'show_preview',
                               reqd: 1,
                               label: __('Show Preview'),
                               in_list_view: 1
                            }],
                        }];
            let preview = new frappe.ui.Dialog({
                title: __('Enter details'),
                fields: fields,
                on_page_show: function(){
                        if(d.payment_request_type === 'Purchase Invoice'){
                            frappe.db.get_doc(d.payment_request_type,d.document_name).then(pi => {
                                pi.items.forEach(i => {
                                cur_dialog.fields[1].data = [{
                                    "bill_name": i.nx_reference_name,
                                    'bill_type': i.nx_reference_doctype
                                }]
                                
                            });
                            cur_dialog.get_field('bills').refresh();
                 
            });
        }
                },
                primary_action_label: 'Close',
                primary_action(values) {
                    preview.hide();
                }
            });
            preview.show();
        
            
        }
});
/*function validate_document(frm,cdt,cdn){
    let d=locals[cdt][cdn];
        frappe.db.get_doc('Purchase Invoice',d.document_name).then(doc =>{
            doc.items.forEach(i =>
                if(i.nx_reference_doctype === "F and F Entry"){
                    frappe.model.set_value(cdt,cdn,"f_and_f_entry",i.nx_reference_name)
                })
        })
}*/
function validate_payment_req_type(frm,cdt,cdn){
    let d=locals[cdt][cdn];
         if(d.payment_request_type === "Purchase Invoice"){
            frappe.model.set_value(cdt,cdn,"party_type","Supplier")
        }
        else if (d.payment_request_type === "Expense Claim") {
            frappe.model.set_value(cdt,cdn,"party_type","Employee")
        }
        else{
            frappe.model.set_value(cdt,cdn,"party_type",null)
        }

}
function get_PI_round_tot(frm,cdt,cdn){
    let d=locals[cdt][cdn];
        if(d.document_name !== undefined){
            frappe.db.get_value("Purchase Invoice",{"name":d.document_name},["rounded_total"]).then(r=>{
                frappe.model.set_value(cdt,cdn,"request_amount",r.message.rounded_total)
                frappe.model.set_value(cdt,cdn,"approved_amount",r.message.rounded_total)
            })
        }
}
function validate_bill_amt(){
    cur_frm.set_value('total_labour_bill_amount', addValue(cur_frm, 'labour_bill_detail', 'request_amount'));
    cur_frm.set_value('approved_labour_bill_amount', addValue(cur_frm, 'labour_bill_detail', 'approved_amount'));
    sumTotalValue();
}
frappe.ui.form.on('Other Payments and Advances', {
    party_name: function(frm,cdt,cdn) {
        let d = locals[cdt][cdn];
        if (d.party_type === "Employee"){
            frappe.db.get_value("Employee",{"name":d.party_name},["first_name"]).then(r => {
                console.log(r)
                frappe.model.set_value(cdt,cdn,"employee_name",r.message.first_name)
            })
        }
    },
    validate: function(frm,cdt,cdn){
        let d = locals[cdt][cdn];
        if (d.party_type === "Employee") {
            frappe.db.get_value("Employee",{"name":d.party_name},["first_name"]).then(r => {
                console.log(r)
                frappe.model.set_value(cdt,dn,"employee_name",r.message.first_name)
            })
        }
    },
    request_amount: function() {
        total_advance_amt();
    },
    approved_amount: function() {
        total_advance_amt();
    },
    other_payments_and_advances_remove: function() {
        total_advance_amt();
    },
    other_payments_and_advances_add: function() {
        total_advance_amt();
    },
    account_head: function(frm, cdt, cdn) {
        validate_closing_balance();
    }
});
function total_advance_amt(){
    cur_frm.set_value('total_requested_advance', addValue(cur_frm, 'other_payments_and_advances', 'request_amount'));
        cur_frm.set_value('total_approved_advance', addValue(cur_frm, 'other_payments_and_advances', 'approved_amount'));
        sumTotalValue();
}
function validate_closing_balance(frm, cdt, cdn){
    let d = locals[cdt][cdn];
        if (d.account_head && d.payment_type === 'Petty Cash') {
            frappe.xcall('construction.construction.doctype.payment_requisition_entry.payment_requisition_entry.update_closing_balance', {
                "accountHead": d.account_head,
                'acc_period': cur_frm.doc.accounting_period
            }).then(r => {
                console.log(r);
                frappe.model.set_value(cdt, cdn, 'closing_balance', r[0]['sum(debit)'] - r[0]['sum(credit)']);
            });
        } else {
            frappe.model.set_value(cdt, cdn, 'closing_balance', null);
        }
}
function payment_request_type_filter(){
    let doc_name = ["Muster Roll Entry", 'Purchase Invoice']
    cur_frm.fields_dict.labour_bill_detail.grid.get_field("payment_request_type").get_query = function() {
        return {
            filters: [
                ['DocType', 'name', 'in', doc_name]
            ]
        }
    }
}











