import jenkins.model.*
import hudson.security.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.common.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*

println "=== IHMS Setup Script Starting ==="

def jenkins = Jenkins.getInstance()

// Create credentials domain
def domain = Domain.global()

try {
    def store = jenkins.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

    // Check and add Nexus Maven credentials
    def existingCreds = store.getCredentials(domain)
    def nexusExists = existingCreds.any { it.id == "nexus-credentials" }
    def dockerExists = existingCreds.any { it.id == "nexus-docker-credentials" }
    def githubExists = existingCreds.any { it.id == "github-credentials" }

    if (!nexusExists) {
        def nexusCreds = new UsernamePasswordCredentialsImpl(
            CredentialsScope.GLOBAL,
            "nexus-credentials",
            "Nexus Maven Repository",
            "admin",
            "admin"
        )
        store.addCredentials(domain, nexusCreds)
        println "✅ Added nexus-credentials"
    } else {
        println "ℹ️ nexus-credentials already exists"
    }

    if (!dockerExists) {
        def dockerCreds = new UsernamePasswordCredentialsImpl(
            CredentialsScope.GLOBAL,
            "nexus-docker-credentials",
            "Nexus Docker Registry",
            "admin",
            "admin"
        )
        store.addCredentials(domain, dockerCreds)
        println "✅ Added nexus-docker-credentials"
    } else {
        println "ℹ️ nexus-docker-credentials already exists"
    }

    if (!githubExists) {
        def githubCreds = new UsernamePasswordCredentialsImpl(
            CredentialsScope.GLOBAL,
            "github-credentials",
            "GitHub for IHMS - UPDATE WITH PAT",
            "gopigopi096",
            "PLACEHOLDER_UPDATE_WITH_PAT"
        )
        store.addCredentials(domain, githubCreds)
        println "✅ Added github-credentials (UPDATE PASSWORD WITH PAT!)"
    } else {
        println "ℹ️ github-credentials already exists"
    }

    jenkins.save()
    println "=== Credentials setup complete ==="

} catch (Exception e) {
    println "❌ Error setting up credentials: ${e.message}"
    e.printStackTrace()
}

