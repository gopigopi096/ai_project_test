import jenkins.model.*
import hudson.security.*
import com.cloudbees.plugins.credentials.*
import com.cloudbees.plugins.credentials.common.*
import com.cloudbees.plugins.credentials.domains.*
import com.cloudbees.plugins.credentials.impl.*
import org.jenkinsci.plugins.workflow.job.*
import org.jenkinsci.plugins.workflow.cps.*

// Get Jenkins instance
def jenkins = Jenkins.getInstance()

// Create credentials domain
def domain = Domain.global()
def store = jenkins.getExtensionList('com.cloudbees.plugins.credentials.SystemCredentialsProvider')[0].getStore()

// Add Nexus Maven credentials
def nexusCreds = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "nexus-credentials",
    "Nexus Maven Repository",
    "admin",
    "admin"
)

// Add Nexus Docker credentials
def dockerCreds = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "nexus-docker-credentials",
    "Nexus Docker Registry",
    "admin",
    "admin"
)

// Add GitHub credentials (placeholder - update with PAT)
def githubCreds = new UsernamePasswordCredentialsImpl(
    CredentialsScope.GLOBAL,
    "github-credentials",
    "GitHub for IHMS",
    "gopigopi096",
    "REPLACE_WITH_GITHUB_PAT"
)

// Add credentials if they don't exist
try {
    store.addCredentials(domain, nexusCreds)
    println "Added nexus-credentials"
} catch (Exception e) {
    println "nexus-credentials already exists or error: ${e.message}"
}

try {
    store.addCredentials(domain, dockerCreds)
    println "Added nexus-docker-credentials"
} catch (Exception e) {
    println "nexus-docker-credentials already exists or error: ${e.message}"
}

try {
    store.addCredentials(domain, githubCreds)
    println "Added github-credentials"
} catch (Exception e) {
    println "github-credentials already exists or error: ${e.message}"
}

jenkins.save()
println "Credentials configured successfully!"

