class DataController < ApplicationController
  def purge
    confirmation = params[:confirmation].to_s.strip.downcase

    if confirmation == "yes, delete everything"
      ActiveRecord::Base.transaction do
        Brew.destroy_all
        Recipe.destroy_all
        Bean.destroy_all
        Basket.destroy_all
      end
      notice_text = admin_logged_in? ? "All private data has been permanently deleted." : "Sandbox data cleared."
      redirect_to root_path, notice: notice_text
    else
      redirect_to root_path, alert: "Confirmation phrase did not match. Deletion cancelled."
    end
  end

  def reset_sandbox
    if !admin_logged_in?
      ActiveRecord::Base.connected_to(role: :sandbox) do
        ActiveRecord::Base.transaction do
          Brew.destroy_all
          Recipe.destroy_all
          Bean.destroy_all
          Basket.destroy_all
          SandboxSeeder.seed
        end
      end
      redirect_to root_path, notice: "Sandbox has been reset to seed data."
    else
      redirect_to root_path, alert: "Admin database cannot be sandbox-reset."
    end
  end
end
