class CleanupSandboxJob < ApplicationJob
  queue_as :default

  def perform(token = nil)
    # No-op in client-side sandbox architecture
  end
end
