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
      subtitle: "Manage your workspace account and security.",
      tabs: {
        details: "Profile Details",
        sessions: "Active Sessions",
      },
      details: {
        memberSince: "Member Since",
        role: "Role",
        username: "Username",
      },
      sessions: {
        title: "Active Sessions",
        subtitle: "Manage your login sessions across devices.",
        terminateAll: "Terminate All Sessions",
        current: "Current",
        started: "Started",
        expires: "Expires",
        noSessions: "No other active sessions found.",
        confirmTerminateTitle: "Terminate All Sessions?",
        confirmTerminateDesc: "You'll be signed out of every device immediately. You will need to log in again on each one.",
        confirmTerminateAction: "Yes, terminate all",
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
        noRecordsMatch: "No records match your search."
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
        title: "Purchases by Buyer",
        subtitle: "Vendor count per buyer this year.",
        vendorLabel: "Vendors",
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
      subtitle: "គ្រប់គ្រងគណនីការងារ និងសុវត្ថិភាពរបស់អ្នក។",
      tabs: {
        details: "ព័ត៌មានប្រវត្តិរូប",
        sessions: "វគ្គសកម្ម",
      },
      details: {
        memberSince: "សមាជិកតាំងពី",
        role: "តួនាទី",
        username: "ឈ្មោះអ្នកប្រើប្រាស់",
      },
      sessions: {
        title: "វគ្គសកម្ម",
        subtitle: "គ្រប់គ្រងវគ្គចូលប្រើរបស់អ្នកនៅលើឧបករណ៍ផ្សេងៗ។",
        terminateAll: "បញ្ចប់វគ្គទាំងអស់",
        current: "បច្ចុប្បន្ន",
        started: "បានចាប់ផ្តើម",
        expires: "ផុតកំណត់",
        noSessions: "រកមិនឃើញវគ្គសកម្មផ្សេងទៀតទេ។",
        confirmTerminateTitle: "បញ្ចប់វគ្គទាំងអស់មែនទេ?",
        confirmTerminateDesc: "អ្នកនឹងត្រូវបានចាកចេញពីគ្រប់ឧបករណ៍ភ្លាមៗ។ អ្នកនឹងត្រូវចូលម្តងទៀតនៅលើឧបករណ៍នីមួយៗ។",
        confirmTerminateAction: "បាទ បញ្ចប់ទាំងអស់",
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
        noRecordsMatch: "គ្មានកំណត់ត្រាត្រូវនឹងការស្វែងរករបស់អ្នកឡើយ។"
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
        title: "ការទិញតាមអ្នកទិញ",
        subtitle: "ចំនួនអ្នកលក់ក្នុងមួយអ្នកទិញសម្រាប់ឆ្នាំនេះ។",
        vendorLabel: "អ្នកលក់",
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
    readonly tabs: {
      readonly details: string;
      readonly sessions: string;
    };
    readonly details: {
      readonly memberSince: string;
      readonly role: string;
      readonly username: string;
    };
    readonly sessions: {
      readonly title: string;
      readonly subtitle: string;
      readonly terminateAll: string;
      readonly current: string;
      readonly started: string;
      readonly expires: string;
      readonly noSessions: string;
      readonly confirmTerminateTitle: string;
      readonly confirmTerminateDesc: string;
      readonly confirmTerminateAction: string;
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
