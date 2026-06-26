"use client"

export type LanguageCode = "en" | "kh"

export const translations = {
  en: {
    sidebar: {
      dashboard: "Dashboard",
      sackRegistration: "Sack Registration",
      leafWeighing: "Leaf Weighing",
      tobaccoPurchase: "Tobacco Purchase",
      invoice: "Invoice",
      farmerContract: "Farmer Contract",
      tobaccoRepay: "Tobacco Repay",
      memberHub: "Member Hub",
    },
    breadcrumb: {
      workspace: "Workspace",
    },
    userMenu: {
      userAccount: "User Account",
      profileSettings: "Profile Settings",
      logout: "Log out",
    },
    profile: {
      title: "Profile",
      subtitle: "Your workspace profile details",
      details: {
        role: "Role",
        username: "Username",
        region: "Region",
      },
    },
    common: {
      selectLanguage: "Select Language",
      english: "English",
      khmer: "Khmer",
      cancel: "Cancel",
      view: "View",
      toggleColumns: "Toggle columns",
      reset: "Reset",
      pagination: {
        rowsPerPage: "Rows per page",
        pageOf: (page: number, total: number) => `Page ${page} of ${total}`,
        rowsSelected: (selected: number, total: number) => `${selected} of ${total} row(s) selected.`,
        goToFirstPage: "Go to first page",
        goToPrevPage: "Go to previous page",
        goToNextPage: "Go to next page",
        goToLastPage: "Go to last page",
      },
    },
    sackRegistration: {
      title: "Sack Registration",
      subtitle: "Register sacks for tobacco leaves.",
      filters: {
        status: "Status",
        statusAll: "All",
        statusPending: "Pending",
        statusConfirmed: "Confirmed",
        timeRange: "Time Range",
        today: "Today",
        thisWeek: "This Week",
        last30Days: "Last 30 Days",
        threeMonths: "3 Months",
        sixMonths: "6 Months",
        twelveMonths: "12 Months",
        allTime: "All",
        sortByWeight: "Sort by Sack",
        smallest: "Smallest",
        largest: "Largest",
        sackWeight: "Sack (Kg)",
        resetAll: "Reset All",
        searchPlaceholder: "Search...",
        searchMobilePlaceholder: "Search...",
        add: "Add",
        filterTitle: "Filters",
      },
      table: {
        no: "No.",
        representative: "Representative",
        farmer: "Farmer",
        farmerId: "Farmer ID",
        status: "Status",
        sackWeight: "Sack (Kg)",
        registeredBy: "Registered By",
        date: "Date",
        actions: "Actions",
        noRecords: "No registrations found.",
        notes: "Notes",
      },
      export: {
        button: "Export",
        title: "Export Data",
        description: "Choose a date and status to export.",
        date: "Date",
        download: "Download .xlsx",
        success: "Exported successfully",
        failed: "Failed to export",
      },
      dialog: {
        editTitle: "Edit Registration",
        editSubtitle: "Make changes to the sack registration details here.",
        farmerMember: "Farmer",
        searchPlaceholder: "Search by Name or ID Card...",
        typeToSearch: "Type to search farmers...",
        noFarmersFound: "No farmers found.",
        idCard: "ID Card",
        status: "Status",
        sackWeightOptional: "Sack (kg) (optional)",
        weightPlaceholder: "e.g. 50.5",
        notesOptional: "Notes (optional)",
        notesPlaceholder: "Additional notes...",
        cancel: "Cancel",
        save: "Save",
        successToast: "Registration updated",
        deleteTitle: "Delete Registration",
        deleteConfirm: "Are you sure you want to delete row No. {no}? This action cannot be undone.",
        deleteSuccessToast: "Registration deleted",
        delete: "Delete",
        edit: "Edit",
        view: "View",
        viewTitle: "Registration Detail",
        viewSubtitle: "Full details for this sack registration record.",
        close: "Close",
        registerTitle: "Register Sack",
        registerSubtitle: "Fill in the details to register a new sack for a farmer.",
        representative: "Representative",
        searchRepPlaceholder: "Search by Name",
        noResultsFound: "No results found.",
        membersCount: "({count} Members)",
        searchFarmerPlaceholder: "Search by Name/ID Card",
        searching: "Searching...",
        selectRepFirst: "Select a representative first.",
        selectRepOrSearchFarmer: "Select a representative, or type a farmer name/ID card to search.",
        autoFillRepPlaceholder: "Auto-filled after selecting a farmer",
        selectedRepresentLabel: "Representative: {name}",
        idCardLabel: "ID Card: {code}",
        registrationDate: "Date",
        selectDatePlaceholder: "Select date...",
        sackWeightKg: "Sack(Kg)",
        register: "Register",
        errSelectRep: "Please select a representative",
        errSelectFarmer: "Please search and select a member farmer",
        errSelectDate: "Please select a date",
        errInvalidWeight: "Please enter a valid sack weight (0 or more)",
        errInvalidWeightPrecision: "Sack weight must have at most 2 decimal places",
        registerSuccessToast: "Sack registered successfully",
      },
      stats: {
        registrations: "Registrations",
        total: "Total",
        today: "Today",
        thisWeek: "This Week",
        thisMonth: "This Month",
        statusBreakdown: "Status",
        approved: "Approved",
        pending: "Pending",
        sackWeight: "Pending Sack",
        average: "Avg / Reg",
      }
    },
    farmerContract: {
      subtitle: "View list of farmers who have a contract in 2026.",
      searchPlaceholder: "Search by Name or ID...",
      noRecordsFound: "No farmer contracts found.",
      resetSort: "Reset Sort",
      reset: "Reset",
      reload: "Reload",
      year: "Year",
      no: "No",
      farmerName: "Farmer Name",
      farmerId: "Farmer ID",
      idCard: "ID Card",
      saplingKg: "Seed",
      expectedYield: "Expected",
      expectedYieldKg: "Expected (kg)",
      purchasedWeight: "Actual",
      purchasedWeightKg: "Actual (kg)",
      land: "Land (a)",
      view: "View",
      toggleColumns: "Toggle columns",
      largestFirst: "Largest first",
      smallestFirst: "Smallest first",
      asc: "Asc",
      desc: "Desc",
    },
    memberHub: {
      title: "Member Hub",
      subtitle: "Manage system members and roles",
      accessDenied: "You don't have permission to view this page",
      noRecordsFound: "No members found",
      searchPlaceholder: "Search by username...",
      manageRegions: "Manage Regions",
      viewDetails: "View Details",
      regionsUpdated: "Regions updated",
      noRegionsAvailable: "No regions available",
      selectAllRegions: "Select all regions",
      save: "Save",
      andMore: "and {count} more",
      roleUpdated: "Role updated",
      columns: {
        no: "No",
        username: "Username",
        role: "Role",
        region: "Region",
        actions: "Actions",
      },
      details: {
        title: "Member Details",
        loginType: "Login Type",
        createdDate: "Created Date",
        region: "Region",
        close: "Close",
      },
    },
    tobaccoPurchase: {
      title: "Tobacco Purchase",
      subtitle: "Manage tobacco purchase records and details.",
      filters: {
        timeRange: "Time Range",
        sortByNetWeight: "Sort by Net Weight",
        sortByGrandTotal: "Sort by Grand Total",
        resetAll: "Reset All",
        searchPlaceholder: "Search invoice, farmer, representative...",
        add: "Add",
      },
      table: {
        no: "No.",
        invoice: "Invoice",
        date: "Date",
        buyer: "Representative",
        vendor: "Farmer",
        region: "Region",
        oven: "Oven",
        items: "Items",
        netWeight: "Net Weight",
        grandTotal: "Grand Total",
        actions: "Actions",
        noRecords: "No records found.",
        noRecordsMatch: "No records match your filters."
      },
      list: {
        deleteTitle: "Are you sure?",
        deleteDesc: "This action cannot be undone. This will permanently delete the purchase record and all its associated details.",
        cancel: "Cancel",
        delete: "Delete",
        deleting: "Deleting...",
        toastLoadDetailsError: "Failed to load purchase details",
        toastDeleteSuccess: "Record deleted successfully",
        toastLoadPrintError: "Failed to load purchase details for printing",
        toastGeneratingPdf: "Generating PDF…",
        toastDownloadSuccess: "Invoice downloaded",
        toastDownloadError: "Failed to download invoice",
      },
      toolbar: {
        representative: "Representative",
        noRepresentativesFound: "No representatives found.",
        clearFilter: "Clear filter",
        searchPlaceholder: "Search records...",
        columnNo: "No.",
        columnInvoiceNo: "Invoice No",
        columnRepresentative: "Representative",
        columnFarmer: "Farmer",
        columnItems: "Items",
        columnTotalWeight: "Total Weight",
        columnGrandTotal: "Grand Total",
        columnDate: "Date",
        columnActions: "Actions",
      },
      columns: {
        openMenu: "Open menu",
        view: "View",
        edit: "Edit",
        print: "Print",
        downloadPdf: "Download as PDF",
        delete: "Delete",
        no: "No.",
        invoiceNo: "Invoice No",
        representative: "Representative",
        farmer: "Farmer",
        region: "Region",
        items: "Items",
        rate: "Rate",
        totalWeight: "Total Weight",
        grandTotal: "Grand Total",
        date: "Date",
      },
      exportButton: {
        export: "Export",
        title: "Export Settlement Report",
        description: "Choose a representative and date range to export.",
        representative: "Representative",
        selectRepresentativePlaceholder: "Select representative",
        dateRange: "Date range",
        today: "Today",
        last7Days: "Last 7 days",
        last30Days: "Last 30 days",
        last3Months: "Last 3 months",
        last6Months: "Last 6 months",
        lastYear: "Last year",
        customRange: "Custom range",
        from: "From",
        to: "To",
        pickDate: "Pick date",
        downloadXlsx: "Download .xlsx",
        toastSuccess: "Exported successfully",
        toastError: "Failed to export",
      },
      dialog: {
        mobileNewTitle: "Add Tobacco",
        mobileEditTitle: "Edit Tobacco",
        mobileViewTitle: "View Tobacco",
        invoiceLabel: "Invoice",
        representativeLabel: "Representative",
        representativeSearchPlaceholder: "Search representative...",
        regionLabel: "Region",
        regionPlaceholder: "Region...",
        farmerLabel: "Farmer",
        farmerSearchPlaceholder: "Search farmer...",
        noFarmersFound: "No farmers found",
        addressLabel: "Address",
        addressPlaceholder: "Enter address...",
        ovenLabel: "Oven",
        ovenPlaceholder: "Oven...",
        exchangeRateLabel: "Exchange Rate",
        remarkLabel: "Remark (Optional)",
        remarkPlaceholder: "Type notes here...",
        purchaseDateLabel: "Purchase Date",
        purchaseDatePlaceholder: "DD/MM/YYYY",
        quotaLabel: "Quota: ",
        sectionPurchaseTitle: "Tobacco Purchase",
        sectionRepayTitle: "Tobacco Repay",
        noItemsYet: "No items yet",
        addItemsHint: "Add tobacco items to build the purchase invoice.",
        addFirstItem: "Add First Item",
        noItemsRecorded: "No tobacco items recorded yet",
        startBuilding: "Start building your purchase invoice by adding tobacco items.",
        totalLabel: "Total",
        itemUnit: "Item",
        totalWeightLabel: "Total Weight",
        grandTotalLabel: "Grand Total",
        addPurchaseBtn: "Purchase",
        addRepayBtn: "Repay",
        close: "Close",
        cancel: "Cancel",
        saveAndPrint: "Save & Print",
        updateShort: "Update",
        saveShort: "Save",
        updatePurchase: "Update Purchase",
        savePurchase: "Save Purchase",
        previewTitle: "Tobacco Purchase Detail Image Preview",
        previewDesc: "Preview of the uploaded image for the tobacco purchase detail.",
        toastSelectBuyer: "Please select a Representative",
        toastSelectVendor: "Please select a Farmer",
        toastSelectRegion: "Please select a Region",
        toastSelectRate: "Please enter a valid exchange rate",
        toastAddDetail: "Please add at least one tobacco purchase or repay item",
        toastCompleteDetail: "Please ensure all item details have a Tobacco Grade, Gross Weight, and Price/Kg",
        toastCompleteReturn: "Please ensure all repay items have a Contract, Tobacco Grade, and Quantity",
        toastSuccessSave: "Purchase recorded successfully",
        toastSuccessUpdate: "Purchase updated successfully",
        toastSuccessRepay: "Repay recorded successfully",
      },
      detailCard: {
        tobaccoTypeLabel: "Tobacco Type",
        searchItemPlaceholder: "Search item...",
        searchAndSelectPlaceholder: "Search and select tobacco type...",
        noTobaccoItemsFound: "No tobacco items found",
        itemLabel: "Item",
        grossWeightLabel: "Gross Weight",
        remorkLabel: "Remork",
        sackLabel: "Sack",
        ownLabel: "Own",
        priceKgLabel: "Price/Kg",
        netWeightLabel: "Net Weight",
        totalLabel: "Total",
        totalAmountLabel: "Total Amount",
        viewPhoto: "View Photo",
        takeCameraPhoto: "Take Camera Photo",
        uploadExisting: "Upload Existing",
      },
      returnSection: {
        contractIdLabel: "Contract ID",
        contractNumberLabel: "Contract Number",
        searchContractPlaceholder: "Search contract...",
        noContractsFound: "No contracts found",
        tobaccoTypeLabel: "Tobacco Type",
        tobaccoItemLabel: "Tobacco Item",
        searchTypePlaceholder: "Search type...",
        searchItemPlaceholder: "Search item...",
        noLabel: "No",
        repayLabel: "Repay",
        completedSuffix: "(Completed)",
        leftSuffix: "({remaining} / {total} Left)",
        noTobaccoTypeInContract: "No tobacco type in contract",
        kg: "Kg",
      },
      form: {
        newTitle: "New Tobacco Purchase",
        newDesc: "Enter purchase details and item breakdown.",
        editTitle: "Edit Tobacco Purchase",
        editDesc: "Update the purchase information below.",
        viewTitle: "View Tobacco Purchase",
        viewDesc: "Viewing purchase details.",
        invoiceNo: "Invoice No.",
        buyer: "Representative selection",
        buyerPlaceholder: "Search representative...",
        vendor: "Farmer selection",
        vendorPlaceholder: "Search farmer...",
        vendorLoading: "Loading farmers...",
        noVendors: "No farmers found for this representative",
        selectBuyerFirst: "Select a representative first",
        date: "Date",
        datePlaceholder: "DD/MM/YYYY",
        note: "Note",
        notePlaceholder: "Optional purchase note...",
        oven: "Oven",
        ovenPlaceholder: "Search oven...",
        noOvens: "No ovens found",
        exchangeRate: "Exchange Rate (៛/$)",
        itemsRecorded: "Items Recorded",
        addFirstItem: "Add First Item",
        noItemsRecorded: "No tobacco items recorded yet",
        startBuilding: "Start building your purchase invoice by adding tobacco items.",
        totalWeight: "Total Weight",
        grandTotal: "Grand Total",
        addRecord: "Add Row",
        saveRecord: "Save Purchase",
        updateRecord: "Update Purchase",
        cancel: "Cancel",
        close: "Close",
        tip: "Tip: Changes are saved only after clicking 'Save Purchase'",
        toastSelectBuyer: "Please select a Representative",
        toastSelectVendor: "Please select a Farmer",
        toastSelectRegion: "Please select a Region",
        toastSelectRate: "Please enter a valid exchange rate",
        toastAddDetail: "Please add at least one tobacco purchase item",
        toastCompleteDetail: "Please ensure all item details have a Tobacco Grade, Gross Weight, and Price/Kg",
        toastSuccessSave: "Purchase recorded successfully",
        toastSuccessUpdate: "Purchase updated successfully",
        itemNum: "Item #",
        removeItem: "Remove Item",
        itemImage: "Item Image",
        searchItem: "Search item...",
        searchItemPlaceholder: "Search and select tobacco item...",
        noItemsFound: "No tobacco items found",
        tobaccoItem: "Tobacco Item",
        borrowLeaf: "Borrow Leaf (Kg)",
        borrowLeafPlaceholder: "Optional",
        borrowLeafAbbr: "Borrow(Kg)",
        grossWeight: "Gross Weight (Kg)",
        grossWeightAbbr: "G.Weight",
        remork: "Remork (Kg)",
        remorkAbbr: "Remork",
        sackWeight: "Sack Weight (Kg)",
        sackWeightAbbr: "Sack(Kg)",
        priceKg: "Price/Kg",
        netWeight: "Net Weight (Kg)",
        netWeightAbbr: "Net (Kg)",
        totalAmount: "Total Amount",
        total: "Total",
      }
    },
    tobaccoRepay: {
      subtitle: "Manage and track tobacco repay records from {from} - {to}.",
      loadMoreError: "Failed to load more records",
      tabs: {
        summary: "Summary",
        history: "History",
      },
      empty: {
        summaryTitle: "No Repay Records",
        summaryDesc: "There are no tobacco repay records for {year} currently.",
      },
      noResults: "No results.",
      toolbar: {
        view: "View",
        toggleColumns: "Toggle columns",
        columns: {
          contractNo: "Contract No",
          representative: "Representative",
          farmer: "Farmer",
          tobaccoType: "Tobacco Type",
          year: "Year",
          qty: "Quantity",
          totalReturned: "Total Returned",
          status: "Status",
        },
        year: "Year",
        reset: "Reset",
        searchPlaceholder: "Search Contract No, Farmer...",
        add: "Add",
      },
      mobileFilter: {
        filters: "Filters",
        resetSort: "Reset Sort",
        year: "Year",
        amountKg: "Amount (kg)",
        deliveryKg: "Delivery (kg)",
        smallest: "Smallest",
        largest: "Largest",
        reset: "Reset",
        searchPlaceholder: "Search Contract No, Farmer...",
        add: "Add",
      },
      summaryTable: {
        no: "No.",
        contractNo: "Contract No",
        representative: "Representative",
        farmer: "Farmer",
        tobaccoType: "Tobacco Type",
        year: "Year",
        amountKg: "Amount (kg)",
        deliveryKg: "Delivery (kg)",
        completed: "Completed",
        pending: "Pending",
        actions: "Actions",
        selectAll: "Select all",
        selectRow: "Select row",
        view: "View",
      },
      createContract: {
        title: "Create Contract",
        farmer: "Farmer",
        farmerSearchPlaceholder: "Search farmer...",
        noFarmerFound: "No farmer found.",
        tobaccoType: "Tobacco Type",
        tobaccoSearchPlaceholder: "Search tobacco type...",
        noTobaccoFound: "No tobacco type found.",
        contractNumber: "Contract Number",
        generating: "Generating...",
        representative: "Representative",
        optional: "(optional)",
        selectRepresentativePlaceholder: "Select a representative...",
        quantityKg: "Quantity (kg)",
        quantityPlaceholder: "Enter quantity...",
        price: "Price",
        pricePlaceholder: "Enter price...",
        rate: "Rate",
        ratePlaceholder: "Enter rate...",
        date: "Date",
        note: "Note",
        notePlaceholder: "Add a note...",
        cancel: "Cancel",
        save: "Save",
        toastSuccess: "Contract created successfully",
        toastError: "Failed to create contract",
        errSelectFarmer: "Please select a farmer",
        errSelectTobacco: "Please select a tobacco type",
        errInvalidQty: "Enter a valid quantity",
        errInvalidPrice: "Enter a valid price",
      },
      recordRepay: {
        title: "Record Repayment",
        tobaccoType: "Tobacco Type",
        totalQuantity: "Total Quantity",
        alreadyRepaid: "Already Repaid",
        remaining: "Remaining",
        repayNumber: "Repay Number",
        generating: "Generating...",
        contract: "Contract",
        quantityKg: "Quantity (kg)",
        quantityPlaceholder: "Enter quantity...",
        farmer: "Farmer",
        oven: "Oven",
        optional: "(optional)",
        selectOvenPlaceholder: "Select an oven...",
        date: "Date",
        note: "Note",
        notePlaceholder: "Add a note...",
        cancel: "Cancel",
        save: "Save",
        toastSuccess: "Repayment recorded successfully",
        toastError: "Failed to record repayment",
        errInvalidQty: "Enter a valid quantity to repay",
        errExceedsRemaining: "Quantity exceeds remaining balance ({remaining} kg)",
      },
      repayRecordDialog: {
        titleAdd: "Add Repay Record",
        titleEdit: "Edit Repay Record",
        titleView: "View Repay Record",
        farmerSearchPlaceholder: "Search farmer...",
        noFarmerFound: "No farmer found.",
        contract: "Contract",
        loadingContracts: "Loading contracts...",
        selectContractPlaceholder: "Select a contract...",
        remaining: "Remaining",
        repayNumber: "Repay Number",
        generating: "Generating...",
        farmer: "Farmer",
        tobaccoType: "Tobacco Type",
        quantityKg: "Quantity (kg)",
        quantityPlaceholder: "Enter quantity...",
        oven: "Oven",
        optional: "(optional)",
        selectOvenPlaceholder: "Select an oven...",
        date: "Date",
        note: "Note",
        notePlaceholder: "Add a note...",
        cancel: "Cancel",
        save: "Save",
        close: "Close",
        viewInvoice: "Invoice",
        viewContractNo: "Contract No",
        viewFarmer: "Farmer",
        viewTobaccoType: "Tobacco Type",
        viewDeliveryKg: "Delivery (kg)",
        viewOven: "Oven",
        viewDate: "Date",
        viewNote: "Note",
        toastCreateSuccess: "Repayment recorded successfully",
        toastCreateError: "Failed to record repayment",
        toastUpdateSuccess: "Repay record updated successfully",
        toastUpdateError: "Failed to update repay record",
        errInvalidQty: "Enter a valid quantity",
        errSelectFarmer: "Please select a farmer",
        errSelectContract: "Please select a contract",
        errExceedsRemaining: "Quantity exceeds remaining balance ({remaining} kg)",
      },
      contractDetail: {
        title: "Contract Detail",
        contractNo: "Contract No",
        representative: "Representative",
        farmer: "Farmer",
        tobaccoType: "Tobacco Type",
        year: "Year",
        amountKg: "Amount (kg)",
        deliveryKg: "Delivery (kg)",
        invoice: "Invoice",
        date: "Date",
        note: "Note",
        noRepayRecords: "No repay records yet.",
        close: "Close",
      },
      card: {
        contractNo: "Contract No",
        representative: "Representative",
        farmer: "Farmer",
        tobaccoType: "Tobacco Type",
        amountKg: "Amount (kg)",
        deliveryKg: "Delivery (kg)",
      },
      history: {
        year: "Year",
        searchPlaceholder: "Search Contract, Repay No...",
        add: "Add",
        emptyTitle: "No History Records",
        emptyDesc: "There are no tobacco repay history records for {year} currently.",
        noResults: "No results.",
        deleteConfirmTitle: "Are you sure?",
        deleteConfirmDesc: "This action cannot be undone. This will permanently delete the repay record.",
        cancel: "Cancel",
        delete: "Delete",
        deleting: "Deleting...",
        toastDeleteSuccess: "Repay record deleted",
        toastDeleteError: "Failed to delete repay record",
        toastPrintError: "Failed to print repay record",
        toastLoadPrintError: "Failed to load repay record for printing",
        toastLoadDownloadError: "Failed to load repay record for download",
        toastDownloadError: "Failed to download repay record",
      },
      historyTable: {
        no: "No.",
        invoice: "Invoice",
        contractNo: "Contract No.",
        representative: "Representative",
        farmer: "Farmer",
        tobacco: "Tobacco",
        deliveryKg: "Delivery (kg)",
        year: "Year",
        date: "Date",
        actions: "Actions",
        openMenu: "Open menu",
        view: "View",
        edit: "Edit",
        print: "Print",
        downloadPdf: "Download as PDF",
        delete: "Delete",
        selectAll: "Select all",
        selectRow: "Select row",
      },
      exportButton: {
        export: "Export",
        title: "Export Repay History",
        description: "Choose a representative and date range to export.",
        representative: "Representative",
        allRepresentatives: "All representatives",
        selectRepresentativePlaceholder: "Select representative",
        dateRange: "Date range",
        last7Days: "Last 7 days",
        last30Days: "Last 30 days",
        last3Months: "Last 3 months",
        last6Months: "Last 6 months",
        lastYear: "Last year",
        customRange: "Custom range",
        from: "From",
        to: "To",
        pickDate: "Pick date",
        downloadXlsx: "Download .xlsx",
        toastSuccess: "Exported successfully",
        toastError: "Failed to export repay history",
      },
    },
    dashboard: {
      title: "Dashboard",
      subtitle: "Daily operational overview and performance metrics.",
      todayPurchases: {
        title: "Today's Purchases",
        weight: "Net Weight",
        value: "Total Value",
        count: "Purchases",
        trendUp: "Up",
        trendDown: "Down",
        vsYesterday: "vs yesterday",
      },
      sackRegistration: {
        title: "Sack Registration",
        total: "Total Registered",
        today: "Today",
        count: "Registrations",
        trendUp: "Up",
        trendDown: "Down",
        vsYesterday: "vs yesterday",
      },
      outstandingRepay: {
        title: "Repay",
        contracted: "Contracted",
        repaid: "Repaid",
        outstanding: "Outstanding",
        today: "Today",
        trendUp: "Up",
        trendDown: "Down",
        vsYesterday: "vs yesterday",
      },
      farmerContracts: {
        title: "Farmer Contracts",
        land: "Total Land (ha)",
        plants: "Total Plants",
        count: "Contracts",
        trendUp: "Up",
        trendDown: "Down",
        thisYear: "this year",
        actionRequired: "Action required",
        goodPerformance: "Good performance",
      },
      trend: {
        title: "Purchase Trend / Repay Trend",
        subtitle: "Daily purchase vs repay weight for the selected period.",
        weightLabel: "Net Weight (kg)",
        purchaseLabel: "Purchase (kg)",
        repayLabel: "Repay (kg)",
        filters: {
          last7Days: "Last 7 days",
          last30Days: "Last 30 days",
          last3Months: "Last 3 months",
          last9Months: "Last 9 months",
          last12Months: "Last 12 months",
          custom: "Custom range",
          apply: "Apply",
          pickDate: "Pick a date range",
        },
      },
      purchaseByBuyer: {
        title: "Purchases by Representative",
        subtitle: "Farmer count per representative this year.",
        vendorLabel: "Farmers",
        noData: "No purchase data yet.",
      },
      purchaseByTobaccoType: {
        title: "Tobacco Purchased by Type",
        subtitle: "Annual weight by type",
        weightLabel: "Weight (kg)",
        totalLabel: "Total Weight",
        noData: "No purchase data yet.",
      },
      repayByTobaccoType: {
        title: "Tobacco Repaid by Type",
        weightLabel: "Weight (kg)",
        noData: "No repay data yet.",
      },
    },
  },
  kh: {
    sidebar: {
      dashboard: "ផ្ទាំងគ្រប់គ្រង",
      sackRegistration: "ចុះឈ្មោះយកបាវ",
      leafWeighing: "ការថ្លឹងស្លឹក",
      tobaccoPurchase: "ការទិញសន្លឹកថ្នាំ",
      invoice: "វិក្កយបត្រ",
      farmerContract: "កិច្ចសន្យាកសិករ",
      tobaccoRepay: "ការសងសន្លឹកថ្នាំ",
      memberHub: "មជ្ឈមណ្ឌលសមាជិក",
    },
    breadcrumb: {
      workspace: "កន្លែងធ្វើការ",
    },
    userMenu: {
      userAccount: "គណនីអ្នកប្រើប្រាស់",
      profileSettings: "ការកំណត់ប្រវត្តិរូប",
      logout: "ចាកចេញ",
    },
    profile: {
      title: "ប្រវត្តិរូប",
      subtitle: "ព័ត៌មានលម្អិតប្រវត្តិរូបការងាររបស់អ្នក",
      details: {
        role: "តួនាទី",
        username: "ឈ្មោះអ្នកប្រើប្រាស់",
        region: "តំបន់",
      },
    },
    common: {
      selectLanguage: "ជ្រើសរើសភាសា",
      english: "English",
      khmer: "ខ្មែរ",
      cancel: "បោះបង់",
      view: "មើល",
      toggleColumns: "បិទ/បើក ជួរឈរ",
      reset: "កំណត់ឡើងវិញ",
      pagination: {
        rowsPerPage: "ជួរដេកក្នុងមួយទំព័រ",
        pageOf: (page: number, total: number) => `ទំព័រទី ${page} នៃ ${total}`,
        rowsSelected: (selected: number, total: number) => `បានជ្រើសរើស ${selected} នៃ ${total} ជួរដេក។`,
        goToFirstPage: "ទៅកាន់ទំព័រដំបូង",
        goToPrevPage: "ទៅកាន់ទំព័រមុន",
        goToNextPage: "ទៅកាន់ទំព័របន្ទាប់",
        goToLastPage: "ទៅកាន់ទំព័រចុងក្រោយ",
      },
    },
    sackRegistration: {
      title: "ចុះឈ្មោះយកបាវ",
      subtitle: "ចុះឈ្មោះ និងគ្រប់គ្រងបាវសម្រាប់ការកែច្នៃថ្នាំជក់។",
      filters: {
        status: "ស្ថានភាព",
        statusAll: "ទាំងអស់",
        statusPending: "កំពុងរង់ចាំ",
        statusConfirmed: "បានបញ្ជាក់",
        timeRange: "ចន្លោះពេល",
        today: "ថ្ងៃនេះ",
        thisWeek: "សប្តាហ៍នេះ",
        last30Days: "៣០ ថ្ងៃចុងក្រោយ",
        threeMonths: "៣ ខែ",
        sixMonths: "៦ ខែ",
        twelveMonths: "១២ ខែ",
        allTime: "ទាំងអស់",
        sortByWeight: "តម្រៀបតាមទម្ងន់បាវ",
        smallest: "តូចបំផុត",
        largest: "ធំបំផុត",
        sackWeight: "បាវ(គីឡូ)",
        resetAll: "កំណត់ឡើងវិញទាំងអស់",
        searchPlaceholder: "តំណាង/កសិករ...",
        searchMobilePlaceholder: "ស្វែងរក...",
        add: "បន្ថែម",
        filterTitle: "តម្រង",
      },
      table: {
        no: "ល.រ",
        representative: "អ្នកតំណាង",
        farmer: "កសិករ",
        farmerId: "លេខកសិករ",
        status: "ស្ថានភាព",
        sackWeight: "បាវ(គីឡូ)",
        registeredBy: "ចុះឈ្មោះដោយ",
        date: "កាលបរិច្ឆេទ",
        actions: "សកម្មភាព",
        noRecords: "រកមិនឃើញការចុះឈ្មោះទេ។",
        notes: "កំណត់ចំណាំ",
      },
      export: {
        button: "នាំចេញ",
        title: "នាំចេញទិន្នន័យ",
        description: "ជ្រើសរើសកាលបរិច្ឆេទ និងស្ថានភាពដើម្បីនាំចេញ។",
        date: "កាលបរិច្ឆេទ",
        download: "ទាញយក .xlsx",
        success: "បាននាំចេញដោយជោគជ័យ",
        failed: "បរាជ័យក្នុងការនាំចេញ",
      },
      dialog: {
        editTitle: "កែសម្រួលការចុះឈ្មោះ",
        editSubtitle: "ធ្វើការផ្លាស់ប្តូរព័ត៌មានលម្អិតនៃការចុះឈ្មោះបាវនៅទីនេះ។",
        farmerMember: "កសិករ",
        searchPlaceholder: "ស្វែងរកតាមឈ្មោះ ឬលេខកាត...",
        typeToSearch: "វាយបញ្ចូលដើម្បីស្វែងរកកសិករ...",
        noFarmersFound: "រកមិនឃើញកសិករទេ។",
        idCard: "អត្តសញ្ញាណប័ណ្ណ",
        status: "ស្ថានភាព",
        sackWeightOptional: "បាវ(គីឡូ) (ស្រេចចិត្ត)",
        weightPlaceholder: "ឧទាហរណ៍៖ ៥០.៥",
        notesOptional: "កំណត់ចំណាំ (ស្រេចចិត្ត)",
        notesPlaceholder: "កំណត់ចំណាំបន្ថែម...",
        cancel: "បោះបង់",
        save: "រក្សាទុក",
        successToast: "បានធ្វើបច្ចុប្បន្នភាពការចុះឈ្មោះ",
        deleteTitle: "លុបការចុះឈ្មោះ",
        deleteConfirm: "តើអ្នកពិតជាចង់លុបជួរ ល.រ {no} មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានឡើយ។",
        deleteSuccessToast: "បានលុបការចុះឈ្មោះដោយជោគជ័យ",
        delete: "លុប",
        edit: "កែសម្រួល",
        view: "មើល",
        viewTitle: "ព័ត៌មានលម្អិតនៃការចុះឈ្មោះ",
        viewSubtitle: "ព័ត៌មានលម្អិតពេញលេញសម្រាប់កំណត់ត្រាចុះឈ្មោះបាវនេះ។",
        close: "បិទ",
        registerTitle: "ចុះឈ្មោះបាវ",
        registerSubtitle: "បំពេញព័ត៌មានលម្អិតដើម្បីចុះឈ្មោះបាវថ្មីសម្រាប់កសិករ។",
        representative: "តំណាង",
        searchRepPlaceholder: "ស្វែងរកតាមឈ្មោះ",
        noResultsFound: "រកមិនឃើញលទ្ធផលទេ។",
        membersCount: "({count} សមាជិក)",
        searchFarmerPlaceholder: "ស្វែងរកតាមឈ្មោះ ឬលេខកាត",
        searching: "កំពុងស្វែងរក...",
        selectRepFirst: "សូមជ្រើសរើសតំណាងជាមុនសិន។",
        selectRepOrSearchFarmer: "សូមជ្រើសរើសតំណាង ឬវាយបញ្ចូលឈ្មោះ/លេខកាតកសិករដើម្បីស្វែងរក។",
        autoFillRepPlaceholder: "បំពេញដោយស្វ័យប្រវត្តិបន្ទាប់ពីជ្រើសរើសកសិករ",
        selectedRepresentLabel: "តំណាង៖ {name}",
        idCardLabel: "លេខកាត៖ {code}",
        registrationDate: "កាលបរិច្ឆេទ",
        selectDatePlaceholder: "ជ្រើសរើសកាលបរិច្ឆេទ...",
        sackWeightKg: "បាវ(គីឡូ)",
        register: "ចុះឈ្មោះ",
        errSelectRep: "សូមជ្រើសរើសតំណាង",
        errSelectFarmer: "សូមស្វែងរក និងជ្រើសរើសសមាជិកកសិករ",
        errSelectDate: "សូមជ្រើសរើសកាលបរិច្ឆេទ",
        errInvalidWeight: "សូមបញ្ចូលទម្ងន់បាវឱ្យបានត្រឹមត្រូវ (ចាប់ពី ០ ឡើងទៅ)",
        errInvalidWeightPrecision: "ទម្ងន់បាវត្រូវតែមានខ្ទង់ទសភាគច្រើនបំផុត ២ ខ្ទង់",
        registerSuccessToast: "បានចុះឈ្មោះបាវដោយជោគជ័យ",
      },
      stats: {
        registrations: "ការចុះឈ្មោះ",
        total: "សរុប",
        today: "ថ្ងៃនេះ",
        thisWeek: "សប្តាហ៍នេះ",
        thisMonth: "ខែនេះ",
        statusBreakdown: "ស្ថានភាព",
        approved: "បានបញ្ជាក់",
        pending: "កំពុងរង់ចាំ",
        sackWeight: "ទម្ងន់បើកបាវ",
        average: "មធ្យម / ករណី",
      }
    },
    tobaccoRepay: {
      subtitle: "គ្រប់គ្រង និងតាមដានកំណត់ត្រាសងសន្លឹកថ្នាំជក់ពីឆ្នាំ {from} - {to}។",
      loadMoreError: "បរាជ័យក្នុងការទាញយកបន្ថែម",
      tabs: {
        summary: "សង្ខេប",
        history: "ប្រវត្តិ",
      },
      empty: {
        summaryTitle: "មិនមានកំណត់ត្រាសងទេ",
        summaryDesc: "មិនមានកំណត់ត្រាសងសន្លឹកថ្នាំជក់សម្រាប់ឆ្នាំ {year} នាពេលនេះទេ។",
      },
      noResults: "គ្មានលទ្ធផល។",
      toolbar: {
        view: "មើល",
        toggleColumns: "បិទ/បើក ជួរឈរ",
        columns: {
          contractNo: "លេខកិច្ចសន្យា",
          representative: "តំណាង",
          farmer: "កសិករ",
          tobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
          year: "ឆ្នាំ",
          qty: "ចំនួន",
          totalReturned: "សងសរុប",
          status: "ស្ថានភាព",
        },
        year: "ឆ្នាំ",
        reset: "កំណត់ឡើងវិញ",
        searchPlaceholder: "ស្វែងរកលេខកិច្ចសន្យា កសិករ...",
        add: "បន្ថែម",
      },
      mobileFilter: {
        filters: "តម្រង",
        resetSort: "កំណត់ឡើងវិញ",
        year: "ឆ្នាំ",
        amountKg: "ចំនួន(គីឡូ)",
        deliveryKg: "ការសង(គីឡូ)",
        smallest: "តូចបំផុត",
        largest: "ធំបំផុត",
        reset: "កំណត់ឡើងវិញ",
        searchPlaceholder: "ស្វែងរកលេខកិច្ចសន្យា កសិករ...",
        add: "បន្ថែម",
      },
      summaryTable: {
        no: "ល.រ",
        contractNo: "លេខកិច្ចសន្យា",
        representative: "តំណាង",
        farmer: "កសិករ",
        tobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
        year: "ឆ្នាំ",
        amountKg: "ចំនួន(គីឡូ)",
        deliveryKg: "ការសង(គីឡូ)",
        completed: "បានបញ្ចប់",
        pending: "កំពុងរង់ចាំ",
        actions: "សកម្មភាព",
        selectAll: "ជ្រើសរើសទាំងអស់",
        selectRow: "ជ្រើសរើសជួរដេក",
        view: "មើល",
      },
      createContract: {
        title: "បង្កើតកិច្ចសន្យា",
        farmer: "កសិករ",
        farmerSearchPlaceholder: "ស្វែងរកកសិករ...",
        noFarmerFound: "រកមិនឃើញកសិករទេ។",
        tobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
        tobaccoSearchPlaceholder: "ស្វែងរកប្រភេទសន្លឹកថ្នាំ...",
        noTobaccoFound: "រកមិនឃើញប្រភេទសន្លឹកថ្នាំទេ។",
        contractNumber: "លេខកិច្ចសន្យា",
        generating: "កំពុងបង្កើត...",
        representative: "តំណាង",
        optional: "(ស្រេចចិត្ត)",
        selectRepresentativePlaceholder: "ជ្រើសរើសតំណាង...",
        quantityKg: "ចំនួន(គីឡូ)",
        quantityPlaceholder: "បញ្ចូលចំនួន...",
        price: "តម្លៃ",
        pricePlaceholder: "បញ្ចូលតម្លៃ...",
        rate: "អត្រា",
        ratePlaceholder: "បញ្ចូលអត្រា...",
        date: "កាលបរិច្ឆេទ",
        note: "កំណត់ចំណាំ",
        notePlaceholder: "បញ្ចូលកំណត់ចំណាំ...",
        cancel: "បោះបង់",
        save: "រក្សាទុក",
        toastSuccess: "បានបង្កើតកិច្ចសន្យាដោយជោគជ័យ",
        toastError: "បរាជ័យក្នុងការបង្កើតកិច្ចសន្យា",
        errSelectFarmer: "សូមជ្រើសរើសកសិករ",
        errSelectTobacco: "សូមជ្រើសរើសប្រភេទសន្លឹកថ្នាំ",
        errInvalidQty: "សូមបញ្ចូលចំនួនឱ្យបានត្រឹមត្រូវ",
        errInvalidPrice: "សូមបញ្ចូលតម្លៃឱ្យបានត្រឹមត្រូវ",
      },
      recordRepay: {
        title: "កត់ត្រាការសង",
        tobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
        totalQuantity: "ចំនួនសរុប",
        alreadyRepaid: "បានសងរួច",
        remaining: "នៅសល់",
        repayNumber: "លេខសងសន្លឹកថ្នាំ",
        generating: "កំពុងបង្កើត...",
        contract: "កិច្ចសន្យា",
        quantityKg: "ចំនួន(គីឡូ)",
        quantityPlaceholder: "បញ្ចូលចំនួន...",
        farmer: "កសិករ",
        oven: "ឡ",
        optional: "(ស្រេចចិត្ត)",
        selectOvenPlaceholder: "ជ្រើសរើសឡ...",
        date: "កាលបរិច្ឆេទ",
        note: "កំណត់ចំណាំ",
        notePlaceholder: "បញ្ចូលកំណត់ចំណាំ...",
        cancel: "បោះបង់",
        save: "រក្សាទុក",
        toastSuccess: "បានកត់ត្រាការសងដោយជោគជ័យ",
        toastError: "បរាជ័យក្នុងការកត់ត្រាការសង",
        errInvalidQty: "សូមបញ្ចូលចំនួនសងឱ្យបានត្រឹមត្រូវ",
        errExceedsRemaining: "ចំនួនលើសសមតុល្យនៅសល់ ({remaining} គីឡូ)",
      },
      repayRecordDialog: {
        titleAdd: "បន្ថែមកំណត់ត្រាសង",
        titleEdit: "កែសម្រួលកំណត់ត្រាសង",
        titleView: "មើលកំណត់ត្រាសង",
        farmerSearchPlaceholder: "ស្វែងរកកសិករ...",
        noFarmerFound: "រកមិនឃើញកសិករទេ។",
        contract: "កិច្ចសន្យា",
        loadingContracts: "កំពុងទាញយកកិច្ចសន្យា...",
        selectContractPlaceholder: "ជ្រើសរើសកិច្ចសន្យា...",
        remaining: "នៅសល់",
        repayNumber: "លេខសងសន្លឹកថ្នាំ",
        generating: "កំពុងបង្កើត...",
        farmer: "កសិករ",
        tobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
        quantityKg: "ចំនួន(គីឡូ)",
        quantityPlaceholder: "បញ្ចូលចំនួន...",
        oven: "ឡ",
        optional: "(ស្រេចចិត្ត)",
        selectOvenPlaceholder: "ជ្រើសរើសឡ...",
        date: "កាលបរិច្ឆេទ",
        note: "កំណត់ចំណាំ",
        notePlaceholder: "បញ្ចូលកំណត់ចំណាំ...",
        cancel: "បោះបង់",
        save: "រក្សាទុក",
        close: "បិទ",
        viewInvoice: "វិក្កយបត្រ",
        viewContractNo: "លេខកិច្ចសន្យា",
        viewFarmer: "កសិករ",
        viewTobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
        viewDeliveryKg: "ការសង(គីឡូ)",
        viewOven: "ឡ",
        viewDate: "កាលបរិច្ឆេទ",
        viewNote: "កំណត់ចំណាំ",
        toastCreateSuccess: "បានកត់ត្រាការសងដោយជោគជ័យ",
        toastCreateError: "បរាជ័យក្នុងការកត់ត្រាការសង",
        toastUpdateSuccess: "បានធ្វើបច្ចុប្បន្នភាពកំណត់ត្រាសងដោយជោគជ័យ",
        toastUpdateError: "បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពកំណត់ត្រាសង",
        errInvalidQty: "សូមបញ្ចូលចំនួនឱ្យបានត្រឹមត្រូវ",
        errSelectFarmer: "សូមជ្រើសរើសកសិករ",
        errSelectContract: "សូមជ្រើសរើសកិច្ចសន្យា",
        errExceedsRemaining: "ចំនួនលើសសមតុល្យនៅសល់ ({remaining} គីឡូ)",
      },
      contractDetail: {
        title: "ព័ត៌មានលម្អិតកិច្ចសន្យា",
        contractNo: "លេខកិច្ចសន្យា",
        representative: "តំណាង",
        farmer: "កសិករ",
        tobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
        year: "ឆ្នាំ",
        amountKg: "ចំនួន(គីឡូ)",
        deliveryKg: "ការសង(គីឡូ)",
        invoice: "វិក្កយបត្រ",
        date: "កាលបរិច្ឆេទ",
        note: "កំណត់ចំណាំ",
        noRepayRecords: "មិនទាន់មានកំណត់ត្រាសងនៅឡើយទេ។",
        close: "បិទ",
      },
      card: {
        contractNo: "លេខកិច្ចសន្យា",
        representative: "តំណាង",
        farmer: "កសិករ",
        tobaccoType: "ប្រភេទសន្លឹកថ្នាំ",
        amountKg: "ចំនួន(គីឡូ)",
        deliveryKg: "ការសង(គីឡូ)",
      },
      history: {
        year: "ឆ្នាំ",
        searchPlaceholder: "ស្វែងរកកិច្ចសន្យា លេខសង...",
        add: "បន្ថែម",
        emptyTitle: "មិនមានកំណត់ត្រាប្រវត្តិទេ",
        emptyDesc: "មិនមានកំណត់ត្រាប្រវត្តិសងសន្លឹកថ្នាំជក់សម្រាប់ឆ្នាំ {year} នាពេលនេះទេ។",
        noResults: "គ្មានលទ្ធផល។",
        deleteConfirmTitle: "តើអ្នកប្រាកដទេ?",
        deleteConfirmDesc: "សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានឡើយ។ វានឹងលុបកំណត់ត្រាសងជាអចិន្ត្រៃយ៍។",
        cancel: "បោះបង់",
        delete: "លុប",
        deleting: "កំពុងលុប...",
        toastDeleteSuccess: "បានលុបកំណត់ត្រាសង",
        toastDeleteError: "បរាជ័យក្នុងការលុបកំណត់ត្រាសង",
        toastPrintError: "បរាជ័យក្នុងការបញ្ចូលកំណត់ត្រាសង",
        toastLoadPrintError: "បរាជ័យក្នុងការទាញយកកំណត់ត្រាសងសម្រាប់បញ្ចូល",
        toastLoadDownloadError: "បរាជ័យក្នុងការទាញយកកំណត់ត្រាសងសម្រាប់ទាញយក",
        toastDownloadError: "បរាជ័យក្នុងការទាញយកកំណត់ត្រាសង",
      },
      historyTable: {
        no: "ល.រ",
        invoice: "វិក្កយបត្រ",
        contractNo: "លេខកិច្ចសន្យា",
        representative: "តំណាង",
        farmer: "កសិករ",
        tobacco: "សន្លឹកថ្នាំ",
        deliveryKg: "ការសង(គីឡូ)",
        year: "ឆ្នាំ",
        date: "កាលបរិច្ឆេទ",
        actions: "សកម្មភាព",
        openMenu: "បើកម៉ឺនុយ",
        view: "មើល",
        edit: "កែសម្រួល",
        print: "បញ្ចូល",
        downloadPdf: "ទាញយកជា PDF",
        delete: "លុប",
        selectAll: "ជ្រើសរើសទាំងអស់",
        selectRow: "ជ្រើសរើសជួរដេក",
      },
      exportButton: {
        export: "នាំចេញ",
        title: "នាំចេញប្រវត្តិសង",
        description: "ជ្រើសរើសតំណាង និងចន្លោះកាលបរិច្ឆេទដើម្បីនាំចេញ។",
        representative: "តំណាង",
        allRepresentatives: "តំណាងទាំងអស់",
        selectRepresentativePlaceholder: "ជ្រើសរើសតំណាង",
        dateRange: "ចន្លោះកាលបរិច្ឆេទ",
        last7Days: "៧ ថ្ងៃចុងក្រោយ",
        last30Days: "៣០ ថ្ងៃចុងក្រោយ",
        last3Months: "៣ ខែចុងក្រោយ",
        last6Months: "៦ ខែចុងក្រោយ",
        lastYear: "១ ឆ្នាំចុងក្រោយ",
        customRange: "កំណត់ដោយខ្លួនឯង",
        from: "ពី",
        to: "ដល់",
        pickDate: "ជ្រើសរើសកាលបរិច្ឆេទ",
        downloadXlsx: "ទាញយក .xlsx",
        toastSuccess: "បាននាំចេញដោយជោគជ័យ",
        toastError: "បរាជ័យក្នុងការនាំចេញប្រវត្តិសង",
      },
    },
    farmerContract: {
      subtitle: "បង្ហាញបញ្ជីឈ្មោះកសិករដែលមានកិច្ចសន្យាក្នុងឆ្នាំ ២០២៦។",
      searchPlaceholder: "ស្វែងរកឈ្មោះ ឬអត្តសញ្ញាណប័ណ្ណ...",
      noRecordsFound: "រកមិនឃើញកិច្ចសន្យាកសិករទេ។",
      resetSort: "កំណត់ឡើងវិញ",
      reset: "កំណត់ឡើងវិញ",
      reload: "ទាញយកឡើងវិញ",
      year: "ឆ្នាំ",
      no: "ល.រ",
      farmerName: "ឈ្មោះកសិករ",
      farmerId: "លេខកាត",
      idCard: "អត្តសញ្ញាណប័ណ្ណ",
      saplingKg: "ចំនួនកូនថ្នាំ",
      expectedYield: "ទិន្នផលរំពឹងទុក",
      expectedYieldKg: "ទម្ងន់រំពឹងទុក (គីឡូ)",
      purchasedWeight: "ទម្ងន់ទិញ",
      purchasedWeightKg: "ទម្ងន់ទិញ (គីឡូ)",
      land: "ដី (អា)",
      view: "មើល",
      toggleColumns: "បង្ហាញ/លាក់ជួរឈរ",
      largestFirst: "ច្រើនបំផុតមុន",
      smallestFirst: "តិចបំផុតមុន",
      asc: "ឡើង",
      desc: "ចុះ",
    },
    memberHub: {
      title: "មជ្ឈមណ្ឌលសមាជិក",
      subtitle: "គ្រប់គ្រងសមាជិក និងតួនាទីប្រព័ន្ធ",
      accessDenied: "អ្នកមិនមានសិទ្ធិមើលទំព័រនេះទេ",
      noRecordsFound: "រកមិនឃើញសមាជិកទេ",
      searchPlaceholder: "ស្វែងរកតាមឈ្មោះអ្នកប្រើប្រាស់...",
      manageRegions: "គ្រប់គ្រងតំបន់",
      viewDetails: "មើលលម្អិត",
      regionsUpdated: "បានធ្វើបច្ចុប្បន្នភាពតំបន់",
      noRegionsAvailable: "មិនមានតំបន់",
      selectAllRegions: "ជ្រើសរើសគ្រប់តំបន់ទាំងអស់",
      save: "រក្សាទុក",
      andMore: "និងផ្សេងទៀត {count}",
      roleUpdated: "បានធ្វើបច្ចុប្បន្នភាពតួនាទី",
      columns: {
        no: "ល.រ",
        username: "ឈ្មោះអ្នកប្រើប្រាស់",
        role: "តួនាទី",
        region: "តំបន់",
        actions: "សកម្មភាព",
      },
      details: {
        title: "ព័ត៌មានលម្អិតសមាជិក",
        loginType: "ប្រភេទចូលប្រើ",
        createdDate: "កាលបរិច្ឆេទបង្កើត",
        region: "តំបន់",
        close: "បិទ",
      },
    },
    tobaccoPurchase: {
      title: "ទិញសន្លឹកថ្នាំជក់",
      subtitle: "គ្រប់គ្រង និងតាមដានកំណត់ត្រាទិញសន្លឹកថ្នាំជក់។",
      filters: {
        timeRange: "ចន្លោះពេល",
        sortByNetWeight: "តម្រៀបតាមទម្ងន់សុទ្ធ",
        sortByGrandTotal: "តម្រៀបតាមតម្លៃសរុប",
        resetAll: "កំណត់ឡើងវិញ",
        searchPlaceholder: "ស្វែងរកវិក្កយបត្រ កសិករ អ្នកទិញ...",
        add: "បន្ថែម",
      },
      table: {
        no: "ល.រ",
        invoice: "វិក្កយបត្រ",
        date: "កាលបរិច្ឆេទ",
        buyer: "អ្នកទិញ",
        vendor: "កសិករ",
        region: "តំបន់",
        oven: "ឡ",
        items: "មុខទំនិញ",
        netWeight: "ទម្ងន់សុទ្ធ",
        grandTotal: "តម្លៃសរុប",
        actions: "សកម្មភាព",
        noRecords: "រកមិនឃើញកំណត់ត្រាទិញទេ។",
        noRecordsMatch: "គ្មានកំណត់ត្រាត្រូវនឹងតម្រងរបស់អ្នកឡើយ។"
      },
      list: {
        deleteTitle: "តើអ្នកប្រាកដទេ?",
        deleteDesc: "សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានឡើយ។ វានឹងលុបកំណត់ត្រាទិញ និងព័ត៌មានលម្អិតទាំងអស់ដែលពាក់ព័ន្ធជាអចិន្ត្រៃយ៍។",
        cancel: "បោះបង់",
        delete: "លុប",
        deleting: "កំពុងលុប...",
        toastLoadDetailsError: "បរាជ័យក្នុងការទាញយកព័ត៌មានលម្អិតនៃការទិញ",
        toastDeleteSuccess: "បានលុបកំណត់ត្រាដោយជោគជ័យ",
        toastLoadPrintError: "បរាជ័យក្នុងការទាញយកព័ត៌មានលម្អិតសម្រាប់បញ្ចូល",
        toastGeneratingPdf: "កំពុងបង្កើត PDF...",
        toastDownloadSuccess: "បានទាញយកវិក្កយបត្រ",
        toastDownloadError: "បរាជ័យក្នុងការទាញយកវិក្កយបត្រ",
      },
      toolbar: {
        representative: "តំណាង",
        noRepresentativesFound: "រកមិនឃើញតំណាងទេ។",
        clearFilter: "សម្អាតតម្រង",
        searchPlaceholder: "ស្វែងរកកំណត់ត្រា...",
        columnNo: "ល.រ",
        columnInvoiceNo: "លេខវិក្កយបត្រ",
        columnRepresentative: "តំណាង",
        columnFarmer: "កសិករ",
        columnItems: "មុខទំនិញ",
        columnTotalWeight: "ទម្ងន់សរុប",
        columnGrandTotal: "តម្លៃសរុប",
        columnDate: "កាលបរិច្ឆេទ",
        columnActions: "សកម្មភាព",
      },
      columns: {
        openMenu: "បើកម៉ឺនុយ",
        view: "មើល",
        edit: "កែសម្រួល",
        print: "បញ្ចូល",
        downloadPdf: "ទាញយកជា PDF",
        delete: "លុប",
        no: "ល.រ",
        invoiceNo: "លេខវិក្កយបត្រ",
        representative: "តំណាង",
        farmer: "កសិករ",
        region: "តំបន់",
        items: "មុខទំនិញ",
        rate: "អត្រា",
        totalWeight: "ទម្ងន់សរុប",
        grandTotal: "តម្លៃសរុប",
        date: "កាលបរិច្ឆេទ",
      },
      exportButton: {
        export: "នាំចេញ",
        title: "នាំចេញរបាយការណ៍ទូទាត់",
        description: "ជ្រើសរើសតំណាង និងចន្លោះកាលបរិច្ឆេទដើម្បីនាំចេញ។",
        representative: "តំណាង",
        selectRepresentativePlaceholder: "ជ្រើសរើសតំណាង",
        dateRange: "ចន្លោះកាលបរិច្ឆេទ",
        today: "ថ្ងៃនេះ",
        last7Days: "៧ ថ្ងៃចុងក្រោយ",
        last30Days: "៣០ ថ្ងៃចុងក្រោយ",
        last3Months: "៣ ខែចុងក្រោយ",
        last6Months: "៦ ខែចុងក្រោយ",
        lastYear: "១ ឆ្នាំចុងក្រោយ",
        customRange: "កំណត់ដោយខ្លួនឯង",
        from: "ពី",
        to: "ដល់",
        pickDate: "ជ្រើសរើសកាលបរិច្ឆេទ",
        downloadXlsx: "ទាញយក .xlsx",
        toastSuccess: "បាននាំចេញដោយជោគជ័យ",
        toastError: "បរាជ័យក្នុងការនាំចេញ",
      },
      dialog: {
        mobileNewTitle: "បន្ថែមថ្នាំជក់",
        mobileEditTitle: "កែសម្រួលថ្នាំជក់",
        mobileViewTitle: "មើលថ្នាំជក់",
        invoiceLabel: "វិក្កយបត្រ",
        representativeLabel: "តំណាង",
        representativeSearchPlaceholder: "ស្វែងរកតំណាង...",
        regionLabel: "តំបន់",
        regionPlaceholder: "តំបន់...",
        farmerLabel: "កសិករ",
        farmerSearchPlaceholder: "ស្វែងរកកសិករ...",
        noFarmersFound: "រកមិនឃើញកសិករទេ",
        addressLabel: "អាសយដ្ឋាន",
        addressPlaceholder: "បញ្ចូលអាសយដ្ឋាន...",
        ovenLabel: "ឡ",
        ovenPlaceholder: "ឡ...",
        exchangeRateLabel: "អត្រាប្តូរប្រាក់",
        remarkLabel: "សម្គាល់ (ស្រេចចិត្ត)",
        remarkPlaceholder: "សូមវាយបញ្ចូលកំណត់ចំណាំ...",
        purchaseDateLabel: "កាលបរិច្ឆេទទិញ",
        purchaseDatePlaceholder: "ថ្ងៃ/ខែ/ឆ្នាំ",
        quotaLabel: "កូតា៖ ",
        sectionPurchaseTitle: "ការទិញសន្លឹកថ្នាំជក់",
        sectionRepayTitle: "ការសងសន្លឹកថ្នាំជក់",
        noItemsYet: "មិនទាន់មានទំនិញនៅឡើយទេ",
        addItemsHint: "បន្ថែមទំនិញថ្នាំជក់ដើម្បីបង្កើតវិក្កយបត្រទិញ។",
        addFirstItem: "បន្ថែមទំនិញដំបូង",
        noItemsRecorded: "មិនទាន់មានទំនិញថ្នាំជក់ត្រូវបានកត់ត្រានៅឡើយទេ",
        startBuilding: "ចាប់ផ្តើមបង្កើតវិក្កយបត្រទិញដោយបន្ថែមទំនិញថ្នាំជក់។",
        totalLabel: "សរុប",
        itemUnit: "ទំនិញ",
        totalWeightLabel: "ទម្ងន់សរុប",
        grandTotalLabel: "តម្លៃសរុប",
        addPurchaseBtn: "ទិញ",
        addRepayBtn: "សង",
        close: "បិទ",
        cancel: "បោះបង់",
        saveAndPrint: "រក្សាទុក និងបញ្ចូល",
        updateShort: "ធ្វើបច្ចុប្បន្នភាព",
        saveShort: "រក្សាទុក",
        updatePurchase: "ធ្វើបច្ចុប្បន្នភាពការទិញ",
        savePurchase: "រក្សាទុកការទិញ",
        previewTitle: "មើលរូបភាពលម្អិតទំនិញទិញសន្លឹកថ្នាំជក់",
        previewDesc: "ការមើលជាមុននៃរូបភាពដែលបានបញ្ចូលសម្រាប់ព័ត៌មានលម្អិតនៃការទិញ។",
        toastSelectBuyer: "សូមជ្រើសរើសតំណាង",
        toastSelectVendor: "សូមជ្រើសរើសកសិករ",
        toastSelectRegion: "សូមជ្រើសរើសតំបន់",
        toastSelectRate: "សូមបញ្ចូលអត្រាប្តូរប្រាក់ឱ្យបានត្រឹមត្រូវ",
        toastAddDetail: "សូមបន្ថែមទំនិញទិញ ឬសងយ៉ាងហោចណាស់មួយ",
        toastCompleteDetail: "សូមប្រាកដថាទំនិញទាំងអស់មានកម្រិតថ្នាក់ ទម្ងន់សរុប និងតម្លៃ/គីឡូ",
        toastCompleteReturn: "សូមប្រាកដថាទំនិញសងទាំងអស់មានកិច្ចសន្យា កម្រិតថ្នាក់ និងចំនួន",
        toastSuccessSave: "បានរក្សាទុកការទិញដោយជោគជ័យ",
        toastSuccessUpdate: "បានធ្វើបច្ចុប្បន្នភាពការទិញដោយជោគជ័យ",
        toastSuccessRepay: "បានកត់ត្រាការសងដោយជោគជ័យ",
      },
      detailCard: {
        tobaccoTypeLabel: "ប្រភេទសន្លឹកថ្នាំ",
        searchItemPlaceholder: "ស្វែងរកទំនិញ...",
        searchAndSelectPlaceholder: "ស្វែងរក និងជ្រើសរើសប្រភេទសន្លឹកថ្នាំ...",
        noTobaccoItemsFound: "រកមិនឃើញទំនិញថ្នាំជក់ទេ",
        itemLabel: "ទំនិញ",
        grossWeightLabel: "ទម្ងន់សរុប",
        remorkLabel: "រ៉ឺម៉ក",
        sackLabel: "បាវ",
        ownLabel: "ផ្ទាល់ខ្លួន",
        priceKgLabel: "តម្លៃ/គីឡូ",
        netWeightLabel: "ទម្ងន់សុទ្ធ",
        totalLabel: "សរុប",
        totalAmountLabel: "ទឹកប្រាក់សរុប",
        viewPhoto: "មើលរូបភាព",
        takeCameraPhoto: "ថតរូបភាព",
        uploadExisting: "ផ្ទុកឡើងរូបភាព",
      },
      returnSection: {
        contractIdLabel: "លេខកិច្ចសន្យា",
        contractNumberLabel: "លេខកិច្ចសន្យា",
        searchContractPlaceholder: "ស្វែងរកកិច្ចសន្យា...",
        noContractsFound: "រកមិនឃើញកិច្ចសន្យាទេ",
        tobaccoTypeLabel: "ប្រភេទសន្លឹកថ្នាំ",
        tobaccoItemLabel: "ទំនិញសន្លឹកថ្នាំ",
        searchTypePlaceholder: "ស្វែងរកប្រភេទ...",
        searchItemPlaceholder: "ស្វែងរកទំនិញ...",
        noLabel: "លេខ",
        repayLabel: "សង",
        completedSuffix: "(បានបញ្ចប់)",
        leftSuffix: "({remaining} / {total} នៅសល់)",
        noTobaccoTypeInContract: "គ្មានប្រភេទសន្លឹកថ្នាំក្នុងកិច្ចសន្យាទេ",
        kg: "គីឡូ",
      },
      form: {
        newTitle: "ការទិញសន្លឹកថ្នាំជក់ថ្មី",
        newDesc: "បញ្ចូលព័ត៌មានលម្អិតនៃការទិញ និងទំនិញនីមួយៗ។",
        editTitle: "កែសម្រួលការទិញសន្លឹកថ្នាំជក់",
        editDesc: "ធ្វើបច្ចុប្បន្នភាពព័ត៌មានលម្អិតនៃការទិញខាងក្រោម។",
        viewTitle: "មើលការទិញសន្លឹកថ្នាំជក់",
        viewDesc: "ការបង្ហាញព័ត៌មានលម្អិតនៃការទិញ។",
        invoiceNo: "លេខវិក្កយបត្រ",
        buyer: "ជ្រើសរើសអ្នកទិញ",
        buyerPlaceholder: "ស្វែងរកអ្នកទិញ...",
        vendor: "ជ្រើសរើសកសិករ",
        vendorPlaceholder: "ស្វែងរកកសិករ...",
        vendorLoading: "កំពុងទាញយកទិន្នន័យកសិករ...",
        noVendors: "រកមិនឃើញកសិករសម្រាប់អ្នកទិញនេះទេ",
        selectBuyerFirst: "សូមជ្រើសរើសអ្នកទិញជាមុនសិន",
        date: "កាលបរិច្ឆេទ",
        datePlaceholder: "ថ្ងៃ/ខែ/ឆ្នាំ",
        note: "សម្គាល់",
        notePlaceholder: "កំណត់ត្រាការទិញផ្សេងៗ...",
        oven: "ឡ",
        ovenPlaceholder: "ស្វែងរកឡ...",
        noOvens: "រកមិនឃើញឡឡើយ",
        exchangeRate: "អត្រាប្តូរប្រាក់ (៛/$)",
        itemsRecorded: "ទំនិញដែលបានកត់ត្រា",
        addFirstItem: "បន្ថែមទំនិញដំបូង",
        noItemsRecorded: "មិនទាន់មានទំនិញថ្នាំជក់ត្រូវបានកត់ត្រានៅឡើយទេ",
        startBuilding: "ចាប់ផ្តើមបង្កើតវិក្កយបត្រទិញដោយបន្ថែមទំនិញថ្នាំជក់។",
        totalWeight: "ទម្ងន់សរុប",
        grandTotal: "តម្លៃសរុប",
        addRecord: "បន្ថែមជួរ",
        saveRecord: "រក្សាទុកការទិញ",
        updateRecord: "ធ្វើបច្ចុប្បន្នភាព",
        cancel: "បោះបង់",
        close: "បិទ",
        tip: "ចំណាំ៖ ការផ្លាស់ប្តូរនឹងត្រូវរក្សាទុកបន្ទាប់ពីចុច 'រក្សាទុកការទិញ'",
        toastSelectBuyer: "សូមជ្រើសរើសអ្នកទិញ",
        toastSelectVendor: "សូមជ្រើសរើសកសិករ",
        toastSelectRegion: "សូមជ្រើសរើសតំបន់",
        toastSelectRate: "សូមបញ្ចូលអត្រាប្តូរប្រាក់ឱ្យបានត្រឹមត្រូវ",
        toastAddDetail: "សូមបន្ថែមទំនិញថ្នាំជក់យ៉ាងហោចណាស់មួយ",
        toastCompleteDetail: "សូមប្រាកដថាទំនិញទាំងអស់មានកម្រិតថ្នាក់ ទម្ងន់សរុប និងតម្លៃ/គីឡូ",
        toastSuccessSave: "បានរក្សាទុកការទិញដោយជោគជ័យ",
        toastSuccessUpdate: "បានធ្វើបច្ចុប្បន្នភាពការទិញដោយជោគជ័យ",
        itemNum: "ទំនិញទី",
        removeItem: "លុបមុខទំនិញ",
        itemImage: "រូបភាពទំនិញ",
        searchItem: "ស្វែងរកទំនិញ...",
        searchItemPlaceholder: "ស្វែងរក និងជ្រើសរើសទំនិញថ្នាំជក់...",
        noItemsFound: "រកមិនឃើញទំនិញថ្នាំជក់ទេ",
        tobaccoItem: "ទំនិញថ្នាំជក់",
        borrowLeaf: "ខ្ចីសន្លឹក (គីឡូ)",
        borrowLeafPlaceholder: "ស្រេចចិត្ត",
        borrowLeafAbbr: "ខ្ចីសន្លឹក",
        grossWeight: "ទម្ងន់សរុប(គីឡូ)",
        grossWeightAbbr: "ទម្ងន់សរុប",
        remork: "រ៉ឺម៉ក(គីឡូ)",
        remorkAbbr: "រ៉ឺម៉ក",
        sackWeight: "បាវ(គីឡូ)",
        sackWeightAbbr: "បាវ",
        priceKg: "តម្លៃ/គីឡូ",
        netWeight: "ទម្ងន់សុទ្ធ(គីឡូ)",
        netWeightAbbr: "ទម្ងន់សុទ្ធ",
        totalAmount: "ទឹកប្រាក់សរុប",
        total: "សរុប",
      }
    },
    dashboard: {
      title: "ផ្ទាំងគ្រប់គ្រង",
      subtitle: "ទិដ្ឋភាពទូទៅនៃសកម្មភាពថ្ងៃនេះ លើការចុះឈ្មោះយកបាវ ការទិញ ការសង និងកិច្ចសន្យា។",
      todayPurchases: {
        title: "ការទិញថ្ងៃនេះ",
        weight: "ទម្ងន់សុទ្ធ",
        value: "តម្លៃសរុប",
        count: "ចំនួនការទិញ",
        trendUp: "កើនឡើង",
        trendDown: "ថយចុះ",
        vsYesterday: "បើធៀបនឹងម្សិលមិញ",
      },
      sackRegistration: {
        title: "ការចុះឈ្មោះយកបាវ",
        total: "ចុះឈ្មោះសរុប",
        today: "ថ្ងៃនេះ",
        count: "ចំនួនការចុះឈ្មោះ",
        trendUp: "កើនឡើង",
        trendDown: "ថយចុះ",
        vsYesterday: "បើធៀបនឹងម្សិលមិញ",
      },
      outstandingRepay: {
        title: "ការសងនៅសល់",
        contracted: "កិច្ចសន្យា",
        repaid: "បានសង",
        outstanding: "នៅសល់",
        today: "ថ្ងៃនេះ",
        trendUp: "កើនឡើង",
        trendDown: "ថយចុះ",
        vsYesterday: "បើធៀបនឹងម្សិលមិញ",
      },
      farmerContracts: {
        title: "កិច្ចសន្យាកសិករ",
        land: "ដីសរុប (ហ.ត.)",
        plants: "ដើមថ្នាំសរុប",
        count: "កិច្ចសន្យា",
        trendUp: "កើនឡើង",
        trendDown: "ថយចុះ",
        thisYear: "ក្នុងឆ្នាំនេះ",
        actionRequired: "ត្រូវការសកម្មភាព",
        goodPerformance: "ការអនុវត្តល្អ",
      },
      trend: {
        title: "ស្ថិតិការទិញ / ការសង",
        subtitle: "ទម្ងន់ការទិញ និងការសងប្រចាំថ្ងៃសម្រាប់រយៈពេលដែលបានជ្រើសរើស។",
        weightLabel: "ទម្ងន់សុទ្ធ (គីឡូ)",
        purchaseLabel: "ការទិញ (គីឡូ)",
        repayLabel: "ការសង (គីឡូ)",
        filters: {
          last7Days: "៧ ថ្ងៃចុងក្រោយ",
          last30Days: "៣០ ថ្ងៃចុងក្រោយ",
          last3Months: "៣ ខែចុងក្រោយ",
          last9Months: "៩ ខែចុងក្រោយ",
          last12Months: "១២ ខែចុងក្រោយ",
          custom: "កំណត់ដោយខ្លួនឯង",
          apply: "អនុវត្ត",
          pickDate: "ជ្រើសរើសកាលបរិច្ឆេទ",
        },
      },
      purchaseByBuyer: {
        title: "ការទិញតាមតំណាង",
        subtitle: "ចំនួនកសិករក្នុងមួយតំណាងសម្រាប់ឆ្នាំនេះ។",
        vendorLabel: "កសិករ",
        noData: "មិនទាន់មានទិន្នន័យទិញនៅឡើយទេ។",
      },
      purchaseByTobaccoType: {
        title: "ការទិញសន្លឹកថ្នាំតាមប្រភេទ",
        subtitle: "ទម្ងន់សុទ្ធដែលបានទិញពីកសិករក្នុងឆ្នាំនេះ តាមប្រភេទសន្លឹកថ្នាំ។",
        weightLabel: "ទម្ងន់ (គីឡូ)",
        totalLabel: "ទម្ងន់សរុប",
        noData: "មិនទាន់មានទិន្នន័យទិញនៅឡើយទេ។",
      },
      repayByTobaccoType: {
        title: "ការសងសន្លឹកថ្នាំតាមប្រភេទ",
        weightLabel: "ទម្ងន់ (គីឡូ)",
        noData: "មិនទាន់មានទិន្នន័យសងនៅឡើយទេ។",
      },
    },
  }
} as const

export type TranslationType = {
  readonly sidebar: {
    readonly dashboard: string;
    readonly sackRegistration: string;
    readonly leafWeighing: string;
    readonly tobaccoPurchase: string;
    readonly invoice: string;
    readonly farmerContract: string;
    readonly tobaccoRepay: string;
    readonly memberHub: string;
  };
  readonly breadcrumb: {
    readonly workspace: string;
  };
  readonly userMenu: {
    readonly userAccount: string;
    readonly profileSettings: string;
    readonly logout: string;
  };
  readonly profile: {
    readonly title: string;
    readonly subtitle: string;
    readonly details: {
      readonly role: string;
      readonly username: string;
      readonly region: string;
    };
  };
  readonly common: {
    readonly selectLanguage: string;
    readonly english: string;
    readonly khmer: string;
    readonly cancel: string;
    readonly view: string;
    readonly toggleColumns: string;
    readonly reset: string;
    readonly pagination: {
      readonly rowsPerPage: string;
      readonly pageOf: (page: number, total: number) => string;
      readonly rowsSelected: (selected: number, total: number) => string;
      readonly goToFirstPage: string;
      readonly goToPrevPage: string;
      readonly goToNextPage: string;
      readonly goToLastPage: string;
    };
  };
  readonly sackRegistration: {
    readonly title: string;
    readonly subtitle: string;
    readonly filters: {
      readonly status: string;
      readonly statusAll: string;
      readonly statusPending: string;
      readonly statusConfirmed: string;
      readonly timeRange: string;
      readonly today: string;
      readonly thisWeek: string;
      readonly last30Days: string;
      readonly threeMonths: string;
      readonly sixMonths: string;
      readonly twelveMonths: string;
      readonly allTime: string;
      readonly sortByWeight: string;
      readonly smallest: string;
      readonly largest: string;
      readonly sackWeight: string;
      readonly resetAll: string;
      readonly searchPlaceholder: string;
      readonly searchMobilePlaceholder: string;
      readonly add: string;
      readonly filterTitle: string;
    };
    readonly table: {
      readonly no: string;
      readonly representative: string;
      readonly farmer: string;
      readonly farmerId: string;
      readonly status: string;
      readonly sackWeight: string;
      readonly registeredBy: string;
      readonly date: string;
      readonly actions: string;
      readonly noRecords: string;
      readonly notes: string;
    };
    readonly export: {
      readonly button: string;
      readonly title: string;
      readonly description: string;
      readonly date: string;
      readonly download: string;
      readonly success: string;
      readonly failed: string;
    };
    readonly dialog: {
      readonly editTitle: string;
      readonly editSubtitle: string;
      readonly farmerMember: string;
      readonly searchPlaceholder: string;
      readonly typeToSearch: string;
      readonly noFarmersFound: string;
      readonly idCard: string;
      readonly status: string;
      readonly sackWeightOptional: string;
      readonly weightPlaceholder: string;
      readonly notesOptional: string;
      readonly notesPlaceholder: string;
      readonly cancel: string;
      readonly save: string;
      readonly successToast: string;
      readonly deleteTitle: string;
      readonly deleteConfirm: string;
      readonly deleteSuccessToast: string;
      readonly delete: string;
      readonly edit: string;
      readonly view: string;
      readonly viewTitle: string;
      readonly viewSubtitle: string;
      readonly close: string;
      readonly registerTitle: string;
      readonly registerSubtitle: string;
      readonly representative: string;
      readonly searchRepPlaceholder: string;
      readonly noResultsFound: string;
      readonly membersCount: string;
      readonly searchFarmerPlaceholder: string;
      readonly searching: string;
      readonly selectRepFirst: string;
      readonly selectRepOrSearchFarmer: string;
      readonly autoFillRepPlaceholder: string;
      readonly selectedRepresentLabel: string;
      readonly idCardLabel: string;
      readonly registrationDate: string;
      readonly selectDatePlaceholder: string;
      readonly sackWeightKg: string;
      readonly register: string;
      readonly errSelectRep: string;
      readonly errSelectFarmer: string;
      readonly errSelectDate: string;
      readonly errInvalidWeight: string;
      readonly errInvalidWeightPrecision: string;
      readonly registerSuccessToast: string;
    };
    readonly stats: {
      readonly registrations: string;
      readonly total: string;
      readonly today: string;
      readonly thisWeek: string;
      readonly thisMonth: string;
      readonly statusBreakdown: string;
      readonly approved: string;
      readonly pending: string;
      readonly sackWeight: string;
      readonly average: string;
    };
  };
  readonly farmerContract: {
    readonly subtitle: string;
    readonly searchPlaceholder: string;
    readonly noRecordsFound: string;
    readonly resetSort: string;
    readonly reset: string;
    readonly reload: string;
    readonly year: string;
    readonly no: string;
    readonly farmerName: string;
    readonly farmerId: string;
    readonly idCard: string;
    readonly saplingKg: string;
    readonly expectedYield: string;
    readonly expectedYieldKg: string;
    readonly purchasedWeight: string;
    readonly purchasedWeightKg: string;
    readonly land: string;
    readonly view: string;
    readonly toggleColumns: string;
    readonly largestFirst: string;
    readonly smallestFirst: string;
    readonly asc: string;
    readonly desc: string;
  };
  readonly memberHub: {
    readonly title: string;
    readonly subtitle: string;
    readonly accessDenied: string;
    readonly noRecordsFound: string;
    readonly searchPlaceholder: string;
    readonly manageRegions: string;
    readonly viewDetails: string;
    readonly regionsUpdated: string;
    readonly noRegionsAvailable: string;
    readonly selectAllRegions: string;
    readonly save: string;
    readonly andMore: string;
    readonly roleUpdated: string;
    readonly columns: {
      readonly no: string;
      readonly username: string;
      readonly role: string;
      readonly region: string;
      readonly actions: string;
    };
    readonly details: {
      readonly title: string;
      readonly loginType: string;
      readonly createdDate: string;
      readonly region: string;
      readonly close: string;
    };
  };
  readonly tobaccoPurchase: {
    readonly title: string;
    readonly subtitle: string;
    readonly filters: {
      readonly timeRange: string;
      readonly sortByNetWeight: string;
      readonly sortByGrandTotal: string;
      readonly resetAll: string;
      readonly searchPlaceholder: string;
      readonly add: string;
    };
    readonly table: {
      readonly no: string;
      readonly invoice: string;
      readonly date: string;
      readonly buyer: string;
      readonly vendor: string;
      readonly region: string;
      readonly oven: string;
      readonly items: string;
      readonly netWeight: string;
      readonly grandTotal: string;
      readonly actions: string;
      readonly noRecords: string;
      readonly noRecordsMatch: string;
    };
    readonly list: {
      readonly deleteTitle: string;
      readonly deleteDesc: string;
      readonly cancel: string;
      readonly delete: string;
      readonly deleting: string;
      readonly toastLoadDetailsError: string;
      readonly toastDeleteSuccess: string;
      readonly toastLoadPrintError: string;
      readonly toastGeneratingPdf: string;
      readonly toastDownloadSuccess: string;
      readonly toastDownloadError: string;
    };
    readonly toolbar: {
      readonly representative: string;
      readonly noRepresentativesFound: string;
      readonly clearFilter: string;
      readonly searchPlaceholder: string;
      readonly columnNo: string;
      readonly columnInvoiceNo: string;
      readonly columnRepresentative: string;
      readonly columnFarmer: string;
      readonly columnItems: string;
      readonly columnTotalWeight: string;
      readonly columnGrandTotal: string;
      readonly columnDate: string;
      readonly columnActions: string;
    };
    readonly columns: {
      readonly openMenu: string;
      readonly view: string;
      readonly edit: string;
      readonly print: string;
      readonly downloadPdf: string;
      readonly delete: string;
      readonly no: string;
      readonly invoiceNo: string;
      readonly representative: string;
      readonly farmer: string;
      readonly region: string;
      readonly items: string;
      readonly rate: string;
      readonly totalWeight: string;
      readonly grandTotal: string;
      readonly date: string;
    };
    readonly exportButton: {
      readonly export: string;
      readonly title: string;
      readonly description: string;
      readonly representative: string;
      readonly selectRepresentativePlaceholder: string;
      readonly dateRange: string;
      readonly today: string;
      readonly last7Days: string;
      readonly last30Days: string;
      readonly last3Months: string;
      readonly last6Months: string;
      readonly lastYear: string;
      readonly customRange: string;
      readonly from: string;
      readonly to: string;
      readonly pickDate: string;
      readonly downloadXlsx: string;
      readonly toastSuccess: string;
      readonly toastError: string;
    };
    readonly dialog: {
      readonly mobileNewTitle: string;
      readonly mobileEditTitle: string;
      readonly mobileViewTitle: string;
      readonly invoiceLabel: string;
      readonly representativeLabel: string;
      readonly representativeSearchPlaceholder: string;
      readonly regionLabel: string;
      readonly regionPlaceholder: string;
      readonly farmerLabel: string;
      readonly farmerSearchPlaceholder: string;
      readonly noFarmersFound: string;
      readonly addressLabel: string;
      readonly addressPlaceholder: string;
      readonly ovenLabel: string;
      readonly ovenPlaceholder: string;
      readonly exchangeRateLabel: string;
      readonly remarkLabel: string;
      readonly remarkPlaceholder: string;
      readonly purchaseDateLabel: string;
      readonly purchaseDatePlaceholder: string;
      readonly quotaLabel: string;
      readonly sectionPurchaseTitle: string;
      readonly sectionRepayTitle: string;
      readonly noItemsYet: string;
      readonly addItemsHint: string;
      readonly addFirstItem: string;
      readonly noItemsRecorded: string;
      readonly startBuilding: string;
      readonly totalLabel: string;
      readonly itemUnit: string;
      readonly totalWeightLabel: string;
      readonly grandTotalLabel: string;
      readonly addPurchaseBtn: string;
      readonly addRepayBtn: string;
      readonly close: string;
      readonly cancel: string;
      readonly saveAndPrint: string;
      readonly updateShort: string;
      readonly saveShort: string;
      readonly updatePurchase: string;
      readonly savePurchase: string;
      readonly previewTitle: string;
      readonly previewDesc: string;
      readonly toastSelectBuyer: string;
      readonly toastSelectVendor: string;
      readonly toastSelectRegion: string;
      readonly toastSelectRate: string;
      readonly toastAddDetail: string;
      readonly toastCompleteDetail: string;
      readonly toastCompleteReturn: string;
      readonly toastSuccessSave: string;
      readonly toastSuccessUpdate: string;
      readonly toastSuccessRepay: string;
    };
    readonly detailCard: {
      readonly tobaccoTypeLabel: string;
      readonly searchItemPlaceholder: string;
      readonly searchAndSelectPlaceholder: string;
      readonly noTobaccoItemsFound: string;
      readonly itemLabel: string;
      readonly grossWeightLabel: string;
      readonly remorkLabel: string;
      readonly sackLabel: string;
      readonly ownLabel: string;
      readonly priceKgLabel: string;
      readonly netWeightLabel: string;
      readonly totalLabel: string;
      readonly totalAmountLabel: string;
      readonly viewPhoto: string;
      readonly takeCameraPhoto: string;
      readonly uploadExisting: string;
    };
    readonly returnSection: {
      readonly contractIdLabel: string;
      readonly contractNumberLabel: string;
      readonly searchContractPlaceholder: string;
      readonly noContractsFound: string;
      readonly tobaccoTypeLabel: string;
      readonly tobaccoItemLabel: string;
      readonly searchTypePlaceholder: string;
      readonly searchItemPlaceholder: string;
      readonly noLabel: string;
      readonly repayLabel: string;
      readonly completedSuffix: string;
      readonly leftSuffix: string;
      readonly noTobaccoTypeInContract: string;
      readonly kg: string;
    };
    readonly form: {
      readonly newTitle: string;
      readonly newDesc: string;
      readonly editTitle: string;
      readonly editDesc: string;
      readonly viewTitle: string;
      readonly viewDesc: string;
      readonly invoiceNo: string;
      readonly buyer: string;
      readonly buyerPlaceholder: string;
      readonly vendor: string;
      readonly vendorPlaceholder: string;
      readonly vendorLoading: string;
      readonly noVendors: string;
      readonly selectBuyerFirst: string;
      readonly date: string;
      readonly datePlaceholder: string;
      readonly note: string;
      readonly notePlaceholder: string;
      readonly oven: string;
      readonly ovenPlaceholder: string;
      readonly noOvens: string;
      readonly exchangeRate: string;
      readonly itemsRecorded: string;
      readonly addFirstItem: string;
      readonly noItemsRecorded: string;
      readonly startBuilding: string;
      readonly totalWeight: string;
      readonly grandTotal: string;
      readonly addRecord: string;
      readonly saveRecord: string;
      readonly updateRecord: string;
      readonly cancel: string;
      readonly close: string;
      readonly tip: string;
      readonly toastSelectBuyer: string;
      readonly toastSelectVendor: string;
      readonly toastSelectRegion: string;
      readonly toastSelectRate: string;
      readonly toastAddDetail: string;
      readonly toastCompleteDetail: string;
      readonly toastSuccessSave: string;
      readonly toastSuccessUpdate: string;
      readonly itemNum: string;
      readonly removeItem: string;
      readonly itemImage: string;
      readonly searchItem: string;
      readonly searchItemPlaceholder: string;
      readonly noItemsFound: string;
      readonly tobaccoItem: string;
      readonly borrowLeaf: string;
      readonly borrowLeafPlaceholder: string;
      readonly borrowLeafAbbr: string;
      readonly grossWeight: string;
      readonly grossWeightAbbr: string;
      readonly remork: string;
      readonly remorkAbbr: string;
      readonly sackWeight: string;
      readonly sackWeightAbbr: string;
      readonly priceKg: string;
      readonly netWeight: string;
      readonly netWeightAbbr: string;
      readonly totalAmount: string;
      readonly total: string;
    };
  };
  readonly tobaccoRepay: {
    readonly subtitle: string;
    readonly loadMoreError: string;
    readonly tabs: {
      readonly summary: string;
      readonly history: string;
    };
    readonly empty: {
      readonly summaryTitle: string;
      readonly summaryDesc: string;
    };
    readonly noResults: string;
    readonly toolbar: {
      readonly view: string;
      readonly toggleColumns: string;
      readonly columns: {
        readonly contractNo: string;
        readonly representative: string;
        readonly farmer: string;
        readonly tobaccoType: string;
        readonly year: string;
        readonly qty: string;
        readonly totalReturned: string;
        readonly status: string;
      };
      readonly year: string;
      readonly reset: string;
      readonly searchPlaceholder: string;
      readonly add: string;
    };
    readonly mobileFilter: {
      readonly filters: string;
      readonly resetSort: string;
      readonly year: string;
      readonly amountKg: string;
      readonly deliveryKg: string;
      readonly smallest: string;
      readonly largest: string;
      readonly reset: string;
      readonly searchPlaceholder: string;
      readonly add: string;
    };
    readonly summaryTable: {
      readonly no: string;
      readonly contractNo: string;
      readonly representative: string;
      readonly farmer: string;
      readonly tobaccoType: string;
      readonly year: string;
      readonly amountKg: string;
      readonly deliveryKg: string;
      readonly completed: string;
      readonly pending: string;
      readonly actions: string;
      readonly selectAll: string;
      readonly selectRow: string;
      readonly view: string;
    };
    readonly createContract: {
      readonly title: string;
      readonly farmer: string;
      readonly farmerSearchPlaceholder: string;
      readonly noFarmerFound: string;
      readonly tobaccoType: string;
      readonly tobaccoSearchPlaceholder: string;
      readonly noTobaccoFound: string;
      readonly contractNumber: string;
      readonly generating: string;
      readonly representative: string;
      readonly optional: string;
      readonly selectRepresentativePlaceholder: string;
      readonly quantityKg: string;
      readonly quantityPlaceholder: string;
      readonly price: string;
      readonly pricePlaceholder: string;
      readonly rate: string;
      readonly ratePlaceholder: string;
      readonly date: string;
      readonly note: string;
      readonly notePlaceholder: string;
      readonly cancel: string;
      readonly save: string;
      readonly toastSuccess: string;
      readonly toastError: string;
      readonly errSelectFarmer: string;
      readonly errSelectTobacco: string;
      readonly errInvalidQty: string;
      readonly errInvalidPrice: string;
    };
    readonly recordRepay: {
      readonly title: string;
      readonly tobaccoType: string;
      readonly totalQuantity: string;
      readonly alreadyRepaid: string;
      readonly remaining: string;
      readonly repayNumber: string;
      readonly generating: string;
      readonly contract: string;
      readonly quantityKg: string;
      readonly quantityPlaceholder: string;
      readonly farmer: string;
      readonly oven: string;
      readonly optional: string;
      readonly selectOvenPlaceholder: string;
      readonly date: string;
      readonly note: string;
      readonly notePlaceholder: string;
      readonly cancel: string;
      readonly save: string;
      readonly toastSuccess: string;
      readonly toastError: string;
      readonly errInvalidQty: string;
      readonly errExceedsRemaining: string;
    };
    readonly repayRecordDialog: {
      readonly titleAdd: string;
      readonly titleEdit: string;
      readonly titleView: string;
      readonly farmerSearchPlaceholder: string;
      readonly noFarmerFound: string;
      readonly contract: string;
      readonly loadingContracts: string;
      readonly selectContractPlaceholder: string;
      readonly remaining: string;
      readonly repayNumber: string;
      readonly generating: string;
      readonly farmer: string;
      readonly tobaccoType: string;
      readonly quantityKg: string;
      readonly quantityPlaceholder: string;
      readonly oven: string;
      readonly optional: string;
      readonly selectOvenPlaceholder: string;
      readonly date: string;
      readonly note: string;
      readonly notePlaceholder: string;
      readonly cancel: string;
      readonly save: string;
      readonly close: string;
      readonly viewInvoice: string;
      readonly viewContractNo: string;
      readonly viewFarmer: string;
      readonly viewTobaccoType: string;
      readonly viewDeliveryKg: string;
      readonly viewOven: string;
      readonly viewDate: string;
      readonly viewNote: string;
      readonly toastCreateSuccess: string;
      readonly toastCreateError: string;
      readonly toastUpdateSuccess: string;
      readonly toastUpdateError: string;
      readonly errInvalidQty: string;
      readonly errSelectFarmer: string;
      readonly errSelectContract: string;
      readonly errExceedsRemaining: string;
    };
    readonly contractDetail: {
      readonly title: string;
      readonly contractNo: string;
      readonly representative: string;
      readonly farmer: string;
      readonly tobaccoType: string;
      readonly year: string;
      readonly amountKg: string;
      readonly deliveryKg: string;
      readonly invoice: string;
      readonly date: string;
      readonly note: string;
      readonly noRepayRecords: string;
      readonly close: string;
    };
    readonly card: {
      readonly contractNo: string;
      readonly representative: string;
      readonly farmer: string;
      readonly tobaccoType: string;
      readonly amountKg: string;
      readonly deliveryKg: string;
    };
    readonly history: {
      readonly year: string;
      readonly searchPlaceholder: string;
      readonly add: string;
      readonly emptyTitle: string;
      readonly emptyDesc: string;
      readonly noResults: string;
      readonly deleteConfirmTitle: string;
      readonly deleteConfirmDesc: string;
      readonly cancel: string;
      readonly delete: string;
      readonly deleting: string;
      readonly toastDeleteSuccess: string;
      readonly toastDeleteError: string;
      readonly toastPrintError: string;
      readonly toastLoadPrintError: string;
      readonly toastLoadDownloadError: string;
      readonly toastDownloadError: string;
    };
    readonly historyTable: {
      readonly no: string;
      readonly invoice: string;
      readonly contractNo: string;
      readonly representative: string;
      readonly farmer: string;
      readonly tobacco: string;
      readonly deliveryKg: string;
      readonly year: string;
      readonly date: string;
      readonly actions: string;
      readonly openMenu: string;
      readonly view: string;
      readonly edit: string;
      readonly print: string;
      readonly downloadPdf: string;
      readonly delete: string;
      readonly selectAll: string;
      readonly selectRow: string;
    };
    readonly exportButton: {
      readonly export: string;
      readonly title: string;
      readonly description: string;
      readonly representative: string;
      readonly allRepresentatives: string;
      readonly selectRepresentativePlaceholder: string;
      readonly dateRange: string;
      readonly last7Days: string;
      readonly last30Days: string;
      readonly last3Months: string;
      readonly last6Months: string;
      readonly lastYear: string;
      readonly customRange: string;
      readonly from: string;
      readonly to: string;
      readonly pickDate: string;
      readonly downloadXlsx: string;
      readonly toastSuccess: string;
      readonly toastError: string;
    };
  };
  readonly dashboard: {
    readonly title: string;
    readonly subtitle: string;
    readonly todayPurchases: {
      readonly title: string;
      readonly weight: string;
      readonly value: string;
      readonly count: string;
      readonly trendUp: string;
      readonly trendDown: string;
      readonly vsYesterday: string;
    };
    readonly sackRegistration: {
      readonly title: string;
      readonly total: string;
      readonly today: string;
      readonly count: string;
      readonly trendUp: string;
      readonly trendDown: string;
      readonly vsYesterday: string;
    };
    readonly outstandingRepay: {
      readonly title: string;
      readonly contracted: string;
      readonly repaid: string;
      readonly outstanding: string;
      readonly today: string;
      readonly trendUp: string;
      readonly trendDown: string;
      readonly vsYesterday: string;
    };
    readonly farmerContracts: {
      readonly title: string;
      readonly land: string;
      readonly plants: string;
      readonly count: string;
      readonly trendUp: string;
      readonly trendDown: string;
      readonly thisYear: string;
      readonly actionRequired: string;
      readonly goodPerformance: string;
    };
    readonly trend: {
      readonly title: string;
      readonly subtitle: string;
      readonly weightLabel: string;
      readonly purchaseLabel: string;
      readonly repayLabel: string;
      readonly filters: {
        readonly last7Days: string;
        readonly last30Days: string;
        readonly last3Months: string;
        readonly last9Months: string;
        readonly last12Months: string;
        readonly custom: string;
        readonly apply: string;
        readonly pickDate: string;
      };
    };
    readonly purchaseByBuyer: {
      readonly title: string;
      readonly subtitle: string;
      readonly vendorLabel: string;
      readonly noData: string;
    };
    readonly purchaseByTobaccoType: {
      readonly title: string;
      readonly subtitle: string;
      readonly weightLabel: string;
      readonly totalLabel: string;
      readonly noData: string;
    };
    readonly repayByTobaccoType: {
      readonly title: string;
      readonly weightLabel: string;
      readonly noData: string;
    };
  };
}
