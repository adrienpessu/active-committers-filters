package main

import (
	"embed"
	"encoding/csv"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

//go:embed templates/index.html
var templateFS embed.FS

type User struct {
	Login      string
	Repository string
	LastPushed string
	LastEmail  string
}

type PageData struct {
	Users                []User
	TotalUsers           int
	FilteredUsers        int
	TotalRepositories    int
	FilteredRepositories int
	RepositoryFilter     string
	OrgStats             []OrgStat
}

type OrgStat struct {
	Organization string
	UserCount    int
}

var csvFilePath string
var users []User

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run main.go <csv_file_path>")
	}

	csvFilePath = os.Args[1]

	// Load CSV data
	var err error
	users, err = loadCSV(csvFilePath)
	if err != nil {
		log.Fatalf("Error loading CSV: %v", err)
	}

	// Setup HTTP handlers
	http.HandleFunc("/", handleIndex)
	http.HandleFunc("/filter", handleFilter)

	log.Println("Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func loadCSV(filePath string) ([]User, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)

	// Read header
	_, err = reader.Read()
	if err != nil {
		return nil, err
	}

	var users []User
	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, err
		}

		if len(record) >= 4 {
			user := User{
				Login:      record[0],
				Repository: record[1],
				LastPushed: record[2],
				LastEmail:  record[3],
			}
			users = append(users, user)
		}
	}

	return users, nil
}

func countUniqueUsers(users []User) int {
	uniqueLogins := make(map[string]bool)
	for _, user := range users {
		uniqueLogins[user.Login] = true
	}
	return len(uniqueLogins)
}

func countUniqueRepositories(users []User) int {
	uniqueRepos := make(map[string]bool)
	for _, user := range users {
		uniqueRepos[user.Repository] = true
	}
	return len(uniqueRepos)
}

func filterUsersByRepository(users []User, repositories string) []User {
	if repositories == "" {
		return users
	}

	// Split repositories by newline and trim whitespace
	repoFilters := strings.Split(repositories, "\n")
	repoMap := make(map[string]bool)
	for _, repo := range repoFilters {
		trimmed := strings.TrimSpace(repo)
		if trimmed != "" {
			repoMap[trimmed] = true
		}
	}

	// If no valid filters, return all users
	if len(repoMap) == 0 {
		return users
	}

	// Filter users
	var filtered []User
	for _, user := range users {
		if repoMap[user.Repository] {
			filtered = append(filtered, user)
		}
	}

	return filtered
}

func extractOrganization(repository string) string {
	// Extract organization from "org/repo" format
	parts := strings.Split(repository, "/")
	if len(parts) > 0 {
		return parts[0]
	}
	return repository
}

func calculateOrgStats(users []User) []OrgStat {
	// Map to track which organization each user is assigned to (first one seen)
	userToOrg := make(map[string]string)
	// Map to count users per organization
	orgUsers := make(map[string]map[string]bool)

	// Process users and assign them to their first organization
	for _, user := range users {
		org := extractOrganization(user.Repository)

		// If user hasn't been assigned to an org yet, assign to this one
		if _, exists := userToOrg[user.Login]; !exists {
			userToOrg[user.Login] = org
		}
	}

	// Count unique users per organization
	for login, org := range userToOrg {
		if orgUsers[org] == nil {
			orgUsers[org] = make(map[string]bool)
		}
		orgUsers[org][login] = true
	}

	// Convert to slice and sort by user count (descending)
	var stats []OrgStat
	for org, users := range orgUsers {
		stats = append(stats, OrgStat{
			Organization: org,
			UserCount:    len(users),
		})
	}

	// Sort by user count (descending), then by name
	for i := 0; i < len(stats); i++ {
		for j := i + 1; j < len(stats); j++ {
			if stats[i].UserCount < stats[j].UserCount ||
				(stats[i].UserCount == stats[j].UserCount && stats[i].Organization > stats[j].Organization) {
				stats[i], stats[j] = stats[j], stats[i]
			}
		}
	}

	return stats
}

func handleIndex(w http.ResponseWriter, r *http.Request) {
	totalUsers := countUniqueUsers(users)
	totalRepositories := countUniqueRepositories(users)
	orgStats := calculateOrgStats(users)

	data := PageData{
		Users:                users,
		TotalUsers:           totalUsers,
		FilteredUsers:        totalUsers,
		TotalRepositories:    totalRepositories,
		FilteredRepositories: totalRepositories,
		RepositoryFilter:     "",
		OrgStats:             orgStats,
	}

	tmpl := template.Must(template.ParseFS(templateFS, "templates/index.html"))
	tmpl.Execute(w, data)
}

func handleFilter(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Redirect(w, r, "/", http.StatusSeeOther)
		return
	}

	repositoryFilter := r.FormValue("repositories")

	filteredUsers := filterUsersByRepository(users, repositoryFilter)
	filteredCount := countUniqueUsers(filteredUsers)
	filteredRepoCount := countUniqueRepositories(filteredUsers)
	totalUsers := countUniqueUsers(users)
	totalRepositories := countUniqueRepositories(users)
	orgStats := calculateOrgStats(filteredUsers)

	data := PageData{
		Users:                filteredUsers,
		TotalUsers:           totalUsers,
		FilteredUsers:        filteredCount,
		TotalRepositories:    totalRepositories,
		FilteredRepositories: filteredRepoCount,
		RepositoryFilter:     repositoryFilter,
		OrgStats:             orgStats,
	}

	tmpl := template.Must(template.ParseFS(templateFS, "templates/index.html"))
	tmpl.Execute(w, data)
}
