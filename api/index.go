package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

// ----------------------------------------------------------------------------
// DATA MODELS
// ----------------------------------------------------------------------------

type PincodeRecord struct {
	ID      string `json:"id"`
	Pincode string `json:"pincode"`
	Area    string `json:"area"`
	Active  bool   `json:"active"`
	AddedAt string `json:"addedAt"`
}

type PawnEnquiry struct {
	ID             string  `json:"id"`
	CustomerName   string  `json:"customerName"`
	CustomerMobile string  `json:"customerMobile"`
	ItemType       string  `json:"itemType"`
	ApproxWeight   float64 `json:"approxWeight"`
	Purity         string  `json:"purity"`
	ExpectedAmount float64 `json:"expectedAmount"`
	ServiceType    string  `json:"serviceType"`
	Pincode        string  `json:"pincode,omitempty"`
	Address        string  `json:"address,omitempty"`
	Status         string  `json:"status"`
	Notes          string  `json:"notes,omitempty"`
	CreatedAt      string  `json:"createdAt"`
	UpdatedAt      string  `json:"updatedAt,omitempty"`
}

type Customer struct {
	ID                            string                 `json:"id"`
	Name                          string                 `json:"name"`
	Mobile                        string                 `json:"mobile"`
	SecondaryMobile               string                 `json:"secondaryMobile,omitempty"`
	AadhaarNumber                 string                 `json:"aadhaarNumber,omitempty"`
	DateOfBirth                   string                 `json:"dateOfBirth,omitempty"`
	Address                       string                 `json:"address,omitempty"`
	City                          string                 `json:"city,omitempty"`
	Pincode                       string                 `json:"pincode,omitempty"`
	Occupation                    string                 `json:"occupation,omitempty"`
	NomineeName                   string                 `json:"nomineeName,omitempty"`
	NomineeRelation               string                 `json:"nomineeRelation,omitempty"`
	NomineePhone                  string                 `json:"nomineePhone,omitempty"`
	PhotoURL                      string                 `json:"photoUrl,omitempty"`
	KycStatus                     string                 `json:"kycStatus"`
	KycRecord                     map[string]interface{} `json:"kycRecord,omitempty"`
	BranchID                      string                 `json:"branchId"`
	CustomerTier                  string                 `json:"customerTier"`
	PreferredBrokerRateAdjustment float64                `json:"preferredBrokerRateAdjustment"`
	PreferredInterestRate         float64                `json:"preferredInterestRate"`
	CreditScoreRating             string                 `json:"creditScoreRating,omitempty"`
	Notes                         string                 `json:"notes,omitempty"`
	CreatedAt                     string                 `json:"createdAt"`
}

type GoldItem struct {
	ID                 string  `json:"id"`
	MortgageID         string  `json:"mortgageId"`
	ItemType           string  `json:"itemType"`
	Description        string  `json:"description"`
	GrossWeight        float64 `json:"grossWeight"`
	StoneWeight        float64 `json:"stoneWeight"`
	NetWeight          float64 `json:"netWeight"`
	Purity             string  `json:"purity"`
	Karat              int     `json:"karat"`
	MarketGoldRate     float64 `json:"marketGoldRate"`
	BrokerMortgageRate float64 `json:"brokerMortgageRate"`
	MarketValue        float64 `json:"marketValue"`
	BrokerValuation    float64 `json:"brokerValuation"`
	PhotoReference     string  `json:"photoReference,omitempty"`
}

type Mortgage struct {
	ID                   string                   `json:"id"`
	MortgageNumber       string                   `json:"mortgageNumber"`
	CustomerID           string                   `json:"customerId"`
	BranchID             string                   `json:"branchId"`
	MortgageDate         string                   `json:"mortgageDate"`
	MaturityDate         string                   `json:"maturityDate"`
	PrincipalAmount      float64                  `json:"principalAmount"`
	InterestRate         float64                  `json:"interestRate"`
	InterestType         string                   `json:"interestType"`
	InterestFrequency    string                   `json:"interestFrequency"`
	PenaltyRateMonthly   float64                  `json:"penaltyRateMonthly"`
	GracePeriodDays      int                      `json:"gracePeriodDays"`
	ProcessingFee        float64                  `json:"processingFee"`
	OtherCharges         float64                  `json:"otherCharges"`
	OutstandingPrincipal float64                  `json:"outstandingPrincipal"`
	OutstandingInterest  float64                  `json:"outstandingInterest"`
	Status               string                   `json:"status"`
	DisbursementMode     string                   `json:"disbursementMode"`
	PacketID             string                   `json:"packetId"`
	Items                []GoldItem               `json:"items"`
	RenewalHistory       []map[string]interface{} `json:"renewalHistory,omitempty"`
	CreatedBy            string                   `json:"createdBy,omitempty"`
	ApprovedBy           string                   `json:"approvedBy,omitempty"`
	LastPaymentDate      string                   `json:"lastPaymentDate,omitempty"`
	CreatedAt            string                   `json:"createdAt"`
	UpdatedAt            string                   `json:"updatedAt,omitempty"`
}

type GoldPacket struct {
	ID               string                   `json:"id"`
	MortgageID       string                   `json:"mortgageId"`
	CustomerID       string                   `json:"customerId"`
	BranchID         string                   `json:"branchId"`
	LockerID         string                   `json:"lockerId"`
	Rack             string                   `json:"rack"`
	Tray             string                   `json:"tray"`
	Bin              string                   `json:"bin,omitempty"`
	Status           string                   `json:"status"`
	TotalGrossWeight float64                  `json:"totalGrossWeight"`
	TotalNetWeight   float64                  `json:"totalNetWeight"`
	ItemCount        int                      `json:"itemCount"`
	Movements        []map[string]interface{} `json:"movements,omitempty"`
	CreatedAt        string                   `json:"createdAt"`
}

type PaymentRecord struct {
	ID               string                 `json:"id"`
	MortgageID       string                 `json:"mortgageId"`
	CustomerID       string                 `json:"customerId"`
	BranchID         string                 `json:"branchId"`
	PaymentDate      string                 `json:"paymentDate"`
	Amount           float64                `json:"amount"`
	PrincipalPortion float64                `json:"principalPortion"`
	InterestPortion  float64                `json:"interestPortion"`
	PenaltyPortion   float64                `json:"penaltyPortion"`
	PaymentMode      string                 `json:"paymentMode"`
	CollectedBy      string                 `json:"collectedBy"`
	ReceiptNumber    string                 `json:"receiptNumber"`
	Notes            string                 `json:"notes,omitempty"`
	Breakdown        map[string]interface{} `json:"breakdown,omitempty"`
	CreatedAt        string                 `json:"createdAt"`
}

type LiveRates struct {
	City      string             `json:"city"`
	Rates     map[string]float64 `json:"rates"`
	UpdatedAt string             `json:"updatedAt"`
}

// ----------------------------------------------------------------------------
// SERVER APPLICATION STATE
// ----------------------------------------------------------------------------

type AppServer struct {
	db        *sql.DB
	useDB     bool
	mu        sync.RWMutex
	pincodes  []PincodeRecord
	enquiries []PawnEnquiry
	customers []Customer
	mortgages []Mortgage
	packets   []GoldPacket
	payments  []PaymentRecord
	rates     LiveRates
}

func NewAppServer(db *sql.DB) *AppServer {
	srv := &AppServer{
		db:    db,
		useDB: db != nil,
		rates: LiveRates{
			City: "Chennai",
			Rates: map[string]float64{
				"24K": 7920.0,
				"22K": 7260.0,
				"20K": 6600.0,
				"18K": 5940.0,
				"14K": 4620.0,
			},
			UpdatedAt: time.Now().Format(time.RFC3339),
		},
	}
	srv.initSeedData()
	return srv
}

func (s *AppServer) initSeedData() {
	s.pincodes = []PincodeRecord{
		{ID: "PIN001", Pincode: "600001", Area: "Chennai - Park Town / Anna Salai", Active: true, AddedAt: "2026-09-28 23:30"},
		{ID: "PIN002", Pincode: "600002", Area: "Chennai - George Town / Mint Street", Active: true, AddedAt: "2026-09-28 23:30"},
		{ID: "PIN003", Pincode: "600006", Area: "Chennai - Triplicane / Chepauk", Active: true, AddedAt: "2026-09-28 23:30"},
		{ID: "PIN004", Pincode: "627356", Area: "Munnirpallam, Tirunelveli, Tamil Nadu", Active: true, AddedAt: "2026-09-28 23:49"},
		{ID: "PIN005", Pincode: "627453", Area: "Pattamadai, Tirunelveli, Tamil Nadu", Active: true, AddedAt: "2026-09-28 23:49"},
	}

	s.customers = []Customer{
		{
			ID:                            "CUS-000101",
			Name:                          "K. Ramanathan",
			Mobile:                        "9840123456",
			DateOfBirth:                   "1985-06-15",
			Address:                       "45 Mint Street, Sowcarpet",
			City:                          "Chennai",
			Pincode:                       "600001",
			Occupation:                    "Textile Merchant",
			PhotoURL:                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
			KycStatus:                     "Verified",
			BranchID:                      "BR-CH-01",
			CustomerTier:                  "VIP Gold",
			PreferredBrokerRateAdjustment: 92,
			PreferredInterestRate:         1.5,
			CreditScoreRating:             "A+",
			CreatedAt:                     time.Now().Add(-30 * 24 * time.Hour).Format(time.RFC3339),
		},
		{
			ID:                            "CUS-000102",
			Name:                          "Meenakshi Sundaram",
			Mobile:                        "9884567890",
			DateOfBirth:                   "1990-11-20",
			Address:                       "12 Car Street, Triplicane",
			City:                          "Chennai",
			Pincode:                       "600006",
			Occupation:                    "Teacher",
			PhotoURL:                      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
			KycStatus:                     "Verified",
			BranchID:                      "BR-CH-01",
			CustomerTier:                  "Regular Premium",
			PreferredBrokerRateAdjustment: 88,
			PreferredInterestRate:         1.8,
			CreditScoreRating:             "A",
			CreatedAt:                     time.Now().Add(-15 * 24 * time.Hour).Format(time.RFC3339),
		},
	}

	s.mortgages = []Mortgage{
		{
			ID:                   "MORT-00001",
			MortgageNumber:       "GM-2026-00001",
			CustomerID:           "CUS-000101",
			BranchID:             "BR-CH-01",
			MortgageDate:         time.Now().Add(-10 * 24 * time.Hour).Format("2006-01-02"),
			MaturityDate:         time.Now().Add(80 * 24 * time.Hour).Format("2006-01-02"),
			PrincipalAmount:      120000.0,
			InterestRate:         1.5,
			InterestType:         "Monthly",
			InterestFrequency:    "Monthly",
			PenaltyRateMonthly:   1.0,
			GracePeriodDays:      7,
			ProcessingFee:        250.0,
			OtherCharges:         0.0,
			OutstandingPrincipal: 120000.0,
			OutstandingInterest:  600.0,
			Status:               "Active",
			DisbursementMode:     "Cash",
			PacketID:             "PKT-2026-000001",
			Items: []GoldItem{
				{
					ID:                 "ITM-01",
					MortgageID:         "MORT-00001",
					ItemType:           "Chain",
					Description:        "22K Traditional Rope Chain (916 Hallmark)",
					GrossWeight:        24.5,
					StoneWeight:        0.5,
					NetWeight:          24.0,
					Purity:             "22K",
					Karat:              22,
					MarketGoldRate:     7260.0,
					BrokerMortgageRate: 6679.0,
					MarketValue:        174240.0,
					BrokerValuation:    160296.0,
				},
			},
			CreatedBy: "Admin",
			CreatedAt: time.Now().Add(-10 * 24 * time.Hour).Format(time.RFC3339),
		},
	}

	s.packets = []GoldPacket{
		{
			ID:               "PKT-2026-000001",
			MortgageID:       "MORT-00001",
			CustomerID:       "CUS-000101",
			BranchID:         "BR-CH-01",
			LockerID:         "L-01",
			Rack:             "R-02",
			Tray:             "T-03",
			Bin:              "Tamper-Proof Pouch #A-101",
			Status:           "In Locker",
			TotalGrossWeight: 24.5,
			TotalNetWeight:   24.0,
			ItemCount:        1,
			CreatedAt:        time.Now().Add(-10 * 24 * time.Hour).Format(time.RFC3339),
		},
	}
}

// ----------------------------------------------------------------------------
// HTTP HANDLERS
// ----------------------------------------------------------------------------

func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON: %v", err)
	}
}

func (s *AppServer) handleHealth(w http.ResponseWriter, r *http.Request) {
	dbStatus := "local memory fallback"
	if s.useDB {
		if err := s.db.Ping(); err == nil {
			dbStatus = "connected (Supabase PostgreSQL)"
		} else {
			dbStatus = fmt.Sprintf("db ping error: %v", err)
		}
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"status":      "ok",
		"service":     "Nexus Gold Backend Engine",
		"version":     "1.0.0",
		"database":    dbStatus,
		"time":        time.Now().Format(time.RFC3339),
		"environment": "production-ready",
	})
}

// --- Pincodes ---
func (s *AppServer) handlePincodes(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch r.Method {
	case http.MethodGet:
		if s.useDB {
			rows, err := s.db.Query("SELECT id, pincode, area, active, added_at FROM doorstep_pincodes ORDER BY added_at DESC")
			if err == nil {
				defer rows.Close()
				var list []PincodeRecord
				for rows.Next() {
					var p PincodeRecord
					var addedAt time.Time
					if err := rows.Scan(&p.ID, &p.Pincode, &p.Area, &p.Active, &addedAt); err == nil {
						p.AddedAt = addedAt.Format("2006-01-02 15:04")
						list = append(list, p)
					}
				}
				jsonResponse(w, http.StatusOK, list)
				return
			}
		}
		jsonResponse(w, http.StatusOK, s.pincodes)

	case http.MethodPost:
		var item PincodeRecord
		if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		if item.Pincode == "" || item.Area == "" {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Pincode and Area are required"})
			return
		}
		if item.ID == "" {
			item.ID = fmt.Sprintf("PIN%d", time.Now().UnixMilli())
		}
		item.AddedAt = time.Now().Format("2006-01-02 15:04")
		item.Active = true

		if s.useDB {
			_, err := s.db.Exec(
				"INSERT INTO doorstep_pincodes (id, pincode, area, active, added_at) VALUES ($1, $2, $3, $4, NOW()) ON CONFLICT (pincode) DO UPDATE SET area = EXCLUDED.area, active = true",
				item.ID, item.Pincode, item.Area, item.Active,
			)
			if err != nil {
				log.Printf("DB error inserting pincode: %v", err)
			}
		}

		// Update in-memory
		for _, existing := range s.pincodes {
			if existing.Pincode == item.Pincode {
				jsonResponse(w, http.StatusConflict, map[string]string{"error": "Pincode already registered"})
				return
			}
		}
		s.pincodes = append([]PincodeRecord{item}, s.pincodes...)
		jsonResponse(w, http.StatusCreated, map[string]interface{}{"success": true, "pincode": item})

	case http.MethodPatch:
		var req struct {
			ID     string `json:"id"`
			Active *bool  `json:"active"`
			Area   string `json:"area"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		if s.useDB && req.Active != nil {
			s.db.Exec("UPDATE doorstep_pincodes SET active = $1 WHERE id = $2", *req.Active, req.ID)
		}
		for i, p := range s.pincodes {
			if p.ID == req.ID {
				if req.Active != nil {
					s.pincodes[i].Active = *req.Active
				}
				if req.Area != "" {
					s.pincodes[i].Area = req.Area
				}
				break
			}
		}
		jsonResponse(w, http.StatusOK, map[string]bool{"success": true})

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id != "" {
			if s.useDB {
				s.db.Exec("DELETE FROM doorstep_pincodes WHERE id = $1", id)
			}
			filtered := make([]PincodeRecord, 0, len(s.pincodes))
			for _, p := range s.pincodes {
				if p.ID != id {
					filtered = append(filtered, p)
				}
			}
			s.pincodes = filtered
		}
		jsonResponse(w, http.StatusOK, map[string]bool{"success": true})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// --- Pawn Enquiries ---
func (s *AppServer) handleEnquiries(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch r.Method {
	case http.MethodGet:
		if s.useDB {
			rows, err := s.db.Query("SELECT id, customer_name, customer_mobile, item_type, approx_weight, purity, expected_amount, service_type, COALESCE(pincode, ''), COALESCE(address, ''), status, COALESCE(notes, ''), created_at FROM pawn_enquiries ORDER BY created_at DESC")
			if err == nil {
				defer rows.Close()
				var list []PawnEnquiry
				for rows.Next() {
					var e PawnEnquiry
					var createdAt time.Time
					if err := rows.Scan(&e.ID, &e.CustomerName, &e.CustomerMobile, &e.ItemType, &e.ApproxWeight, &e.Purity, &e.ExpectedAmount, &e.ServiceType, &e.Pincode, &e.Address, &e.Status, &e.Notes, &createdAt); err == nil {
						e.CreatedAt = createdAt.Format(time.RFC3339)
						list = append(list, e)
					}
				}
				jsonResponse(w, http.StatusOK, list)
				return
			}
		}
		jsonResponse(w, http.StatusOK, s.enquiries)

	case http.MethodPost:
		var e PawnEnquiry
		if err := json.NewDecoder(r.Body).Decode(&e); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		if e.CustomerName == "" || e.CustomerMobile == "" {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Customer name and mobile are required"})
			return
		}
		if e.ID == "" {
			e.ID = fmt.Sprintf("ENQ-%d", time.Now().UnixMilli()%1000000)
		}
		if e.Status == "" {
			e.Status = "PENDING"
		}
		e.CreatedAt = time.Now().Format(time.RFC3339)

		if s.useDB {
			s.db.Exec(`
				INSERT INTO pawn_enquiries (id, customer_name, customer_mobile, item_type, approx_weight, purity, expected_amount, service_type, pincode, address, status, notes, created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
				e.ID, e.CustomerName, e.CustomerMobile, e.ItemType, e.ApproxWeight, e.Purity, e.ExpectedAmount, e.ServiceType, e.Pincode, e.Address, e.Status, e.Notes,
			)
		}

		s.enquiries = append([]PawnEnquiry{e}, s.enquiries...)
		jsonResponse(w, http.StatusCreated, map[string]interface{}{"success": true, "enquiry": e})

	case http.MethodPatch:
		var req struct {
			ID     string `json:"id"`
			Status string `json:"status"`
			Notes  string `json:"notes"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		if s.useDB {
			s.db.Exec("UPDATE pawn_enquiries SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3", req.Status, req.Notes, req.ID)
		}
		for i, e := range s.enquiries {
			if e.ID == req.ID {
				if req.Status != "" {
					s.enquiries[i].Status = req.Status
				}
				if req.Notes != "" {
					s.enquiries[i].Notes = req.Notes
				}
				s.enquiries[i].UpdatedAt = time.Now().Format(time.RFC3339)
				break
			}
		}
		jsonResponse(w, http.StatusOK, map[string]bool{"success": true})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// --- Customers ---
func (s *AppServer) handleCustomers(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch r.Method {
	case http.MethodGet:
		// Check single lookup by id or mobile
		queryID := r.URL.Query().Get("id")
		queryMobile := r.URL.Query().Get("mobile")

		if queryID != "" || queryMobile != "" {
			for _, c := range s.customers {
				if (queryID != "" && strings.EqualFold(c.ID, queryID)) ||
					(queryMobile != "" && strings.Contains(c.Mobile, queryMobile)) {
					jsonResponse(w, http.StatusOK, c)
					return
				}
			}
			jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Customer not found"})
			return
		}

		jsonResponse(w, http.StatusOK, s.customers)

	case http.MethodPost:
		var c Customer
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		if c.ID == "" {
			c.ID = fmt.Sprintf("CUS-%06d", len(s.customers)+101)
		}
		if c.CreatedAt == "" {
			c.CreatedAt = time.Now().Format(time.RFC3339)
		}
		s.customers = append([]Customer{c}, s.customers...)
		jsonResponse(w, http.StatusCreated, c)

	case http.MethodPut, http.MethodPatch:
		var c Customer
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		for i, existing := range s.customers {
			if existing.ID == c.ID {
				s.customers[i] = c
				jsonResponse(w, http.StatusOK, c)
				return
			}
		}
		s.customers = append([]Customer{c}, s.customers...)
		jsonResponse(w, http.StatusOK, c)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// --- Mortgages ---
func (s *AppServer) handleMortgages(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch r.Method {
	case http.MethodGet:
		queryNum := r.URL.Query().Get("number")
		queryCust := r.URL.Query().Get("customerId")

		if queryNum != "" {
			for _, m := range s.mortgages {
				if strings.EqualFold(m.MortgageNumber, queryNum) || strings.EqualFold(m.ID, queryNum) {
					jsonResponse(w, http.StatusOK, m)
					return
				}
			}
			jsonResponse(w, http.StatusNotFound, map[string]string{"error": "Mortgage not found"})
			return
		}

		if queryCust != "" {
			var custLoans []Mortgage
			for _, m := range s.mortgages {
				if strings.EqualFold(m.CustomerID, queryCust) {
					custLoans = append(custLoans, m)
				}
			}
			jsonResponse(w, http.StatusOK, custLoans)
			return
		}

		jsonResponse(w, http.StatusOK, s.mortgages)

	case http.MethodPost:
		var m Mortgage
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		if m.ID == "" {
			m.ID = fmt.Sprintf("MORT-%05d", len(s.mortgages)+1)
		}
		if m.MortgageNumber == "" {
			m.MortgageNumber = fmt.Sprintf("GM-%d-%05d", time.Now().Year(), len(s.mortgages)+1)
		}
		if m.CreatedAt == "" {
			m.CreatedAt = time.Now().Format(time.RFC3339)
		}
		if m.Status == "" {
			m.Status = "Active"
		}
		s.mortgages = append([]Mortgage{m}, s.mortgages...)
		jsonResponse(w, http.StatusCreated, m)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// --- Payments ---
func (s *AppServer) handlePayments(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch r.Method {
	case http.MethodGet:
		mortgageID := r.URL.Query().Get("mortgageId")
		if mortgageID != "" {
			var filtered []PaymentRecord
			for _, p := range s.payments {
				if p.MortgageID == mortgageID {
					filtered = append(filtered, p)
				}
			}
			jsonResponse(w, http.StatusOK, filtered)
			return
		}
		jsonResponse(w, http.StatusOK, s.payments)

	case http.MethodPost:
		var p PaymentRecord
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		if p.ID == "" {
			p.ID = fmt.Sprintf("PAY-%d", time.Now().UnixMilli()%1000000)
		}
		if p.PaymentDate == "" {
			p.PaymentDate = time.Now().Format(time.RFC3339)
		}
		s.payments = append([]PaymentRecord{p}, s.payments...)
		jsonResponse(w, http.StatusCreated, p)

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// --- Bullion Rates ---
func (s *AppServer) handleRates(w http.ResponseWriter, r *http.Request) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch r.Method {
	case http.MethodGet:
		jsonResponse(w, http.StatusOK, s.rates)
	case http.MethodPost:
		var rReq LiveRates
		if err := json.NewDecoder(r.Body).Decode(&rReq); err != nil {
			jsonResponse(w, http.StatusBadRequest, map[string]string{"error": "Invalid body"})
			return
		}
		s.rates = rReq
		s.rates.UpdatedAt = time.Now().Format(time.RFC3339)
		jsonResponse(w, http.StatusOK, s.rates)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// --- Public Web Passbook (Aggregated Customer Portal API) ---
func (s *AppServer) handleCustomerPassbook(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	custID := r.URL.Query().Get("c")
	mortNum := r.URL.Query().Get("m")

	var matchedCust *Customer
	var matchedMort *Mortgage

	if custID != "" {
		for _, c := range s.customers {
			if strings.EqualFold(c.ID, custID) || strings.EqualFold(c.Mobile, custID) {
				matchedCust = &c
				break
			}
		}
	}

	if mortNum != "" {
		for _, m := range s.mortgages {
			if strings.EqualFold(m.MortgageNumber, mortNum) || strings.EqualFold(m.ID, mortNum) {
				matchedMort = &m
				if matchedCust == nil {
					for _, c := range s.customers {
						if c.ID == m.CustomerID {
							matchedCust = &c
							break
						}
					}
				}
				break
			}
		}
	}

	if matchedCust == nil && matchedMort == nil {
		jsonResponse(w, http.StatusNotFound, map[string]string{"error": "No passbook found for provided reference"})
		return
	}

	var custMortgages []Mortgage
	if matchedCust != nil {
		for _, m := range s.mortgages {
			if m.CustomerID == matchedCust.ID {
				custMortgages = append(custMortgages, m)
			}
		}
	} else if matchedMort != nil {
		custMortgages = append(custMortgages, *matchedMort)
	}

	totalOutstanding := 0.0
	for _, m := range custMortgages {
		if m.Status == "Active" || m.Status == "Due" || m.Status == "Overdue" {
			totalOutstanding += m.OutstandingPrincipal
		}
	}

	response := map[string]interface{}{
		"customer":         matchedCust,
		"activeMortgage":   matchedMort,
		"mortgages":        custMortgages,
		"totalOutstanding": totalOutstanding,
		"rates":            s.rates,
		"verified":         true,
	}

	jsonResponse(w, http.StatusOK, response)
}

// ----------------------------------------------------------------------------
// CORS MIDDLEWARE
// ----------------------------------------------------------------------------

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, apikey")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Length, Content-Range")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// ----------------------------------------------------------------------------
// VERCEL SERVERLESS HANDLER
// ----------------------------------------------------------------------------

var (
	appServer *AppServer
	apiMux    http.Handler
	initOnce  sync.Once
)

func initialize() {
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	var db *sql.DB
	var err error

	if dbURL != "" {
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("⚠️ Vercel Go: Could not open PostgreSQL driver: %v", err)
		} else if err = db.Ping(); err != nil {
			log.Printf("⚠️ Vercel Go: PostgreSQL ping failed: %v. Running with local fallback.", err)
			db = nil
		} else {
			log.Printf("✅ Vercel Go: Successfully connected to Supabase PostgreSQL database!")
		}
	} else {
		log.Println("ℹ️ Vercel Go: DATABASE_URL not set. Running with fallback state.")
	}

	appServer = NewAppServer(db)
	mux := http.NewServeMux()

	// Register with /api/ prefix
	mux.HandleFunc("/api/health", appServer.handleHealth)
	mux.HandleFunc("/api/pincodes", appServer.handlePincodes)
	mux.HandleFunc("/api/enquiries", appServer.handleEnquiries)
	mux.HandleFunc("/api/customers", appServer.handleCustomers)
	mux.HandleFunc("/api/mortgages", appServer.handleMortgages)
	mux.HandleFunc("/api/payments", appServer.handlePayments)
	mux.HandleFunc("/api/rates", appServer.handleRates)
	mux.HandleFunc("/api/portal/passbook", appServer.handleCustomerPassbook)

	// Fallbacks without /api/
	mux.HandleFunc("/health", appServer.handleHealth)
	mux.HandleFunc("/pincodes", appServer.handlePincodes)
	mux.HandleFunc("/enquiries", appServer.handleEnquiries)
	mux.HandleFunc("/customers", appServer.handleCustomers)
	mux.HandleFunc("/mortgages", appServer.handleMortgages)
	mux.HandleFunc("/payments", appServer.handlePayments)
	mux.HandleFunc("/rates", appServer.handleRates)
	mux.HandleFunc("/portal/passbook", appServer.handleCustomerPassbook)

	apiMux = withCORS(mux)
}

// Handler is the primary entrypoint for Vercel Serverless Functions (Go runtime)
func Handler(w http.ResponseWriter, r *http.Request) {
	initOnce.Do(initialize)
	apiMux.ServeHTTP(w, r)
}

