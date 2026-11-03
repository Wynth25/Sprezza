class DataController < ApplicationController
  before_action :require_admin!

  def purge
    confirmation = params[:confirmation].to_s.strip.downcase

    if confirmation == "yes, delete everything"
      ActiveRecord::Base.transaction do
        Brew.destroy_all
        Recipe.destroy_all
        Bean.destroy_all
        Basket.destroy_all
      end
      redirect_to root_path, notice: "All private data has been permanently deleted."
    else
      redirect_to root_path, alert: "Confirmation phrase did not match. Deletion cancelled."
    end
  end
end
