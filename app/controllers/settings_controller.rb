class SettingsController < ApplicationController
  before_action :require_admin!, only: %i[ update ]

  def show
  end

  def update
    device = params[:device].to_s
    cols = params[:cols].to_s

    if %w[desktop mobile].include?(device) && %w[2 3].include?(cols)
      Setting.set("grid_#{device}", cols)
      render json: { status: "ok", device: device, cols: cols }
    else
      render json: { error: "Invalid setting" }, status: :unprocessable_entity
    end
  end
end
