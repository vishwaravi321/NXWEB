def getBillList(billTypeList,filters):
    billList = []
    pyFilter = eval(filters)
    for d in eval(billList):
        billList.append(frappe.db.get_list(d,{'project':pyFilter["project"],'company':pyFilter["company"],'posting_date':["<=",pyFilter["startDate"]],'posting_date':[">=",pyFilter["startDate"]]},["name","posting_date","doctype","total_amount"]))
    
    print(billList)
    return billList
    



