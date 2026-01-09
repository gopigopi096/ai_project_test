import jenkins.model.*
import org.jenkinsci.plugins.workflow.job.*
import org.jenkinsci.plugins.workflow.cps.*
import hudson.plugins.git.*
import hudson.model.*

def jenkins = Jenkins.getInstance()

// Check if job already exists
def jobName = "IHMS-Build"
def existingJob = jenkins.getItem(jobName)

if (existingJob != null) {
    println "Job ${jobName} already exists"
} else {
    // Create new Pipeline job
    def job = jenkins.createProject(WorkflowJob.class, jobName)
    job.setDescription("IHMS - Integrated Hospital Management System Build Pipeline")

    // Configure SCM
    def scm = new GitSCM("https://github.com/gopigopi096/ai_project_test.git")
    scm.branches = [new BranchSpec("*/main")]
    scm.userRemoteConfigs = [new UserRemoteConfig(
        "https://github.com/gopigopi096/ai_project_test.git",
        null,
        null,
        "github-credentials"
    )]

    // Set pipeline definition from SCM
    def flowDefinition = new CpsScmFlowDefinition(scm, "Jenkinsfile.selectable")
    flowDefinition.setLightweight(true)
    job.setDefinition(flowDefinition)

    jenkins.save()
    println "Job ${jobName} created successfully!"
}

println "Pipeline job setup complete!"

