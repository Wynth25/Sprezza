class SessionsController < ApplicationController
  def new
  end

  def create
    submitted_password = (params[:password] || params.dig(:session, :password)).to_s
    expected_password = load_expected_password.to_s

    if expected_password.blank?
      flash.now[:alert] = "ADMIN_PASSWORD is not configured."
      render :new, status: :unprocessable_entity
    elsif ActiveSupport::SecurityUtils.secure_compare(submitted_password.strip, expected_password.strip)
      session[:admin_id] = "admin_authorized"
      cookies.permanent.encrypted[:admin_auth] = "admin_authorized"
      redirect_to root_path, notice: "Admin mode unlocked! Device remembered."
    else
      flash.now[:alert] = "Invalid password."
      render :new, status: :unprocessable_entity
    end
  end

  def destroy
    session[:admin_id] = nil
    cookies.delete(:admin_auth)
    redirect_to root_path, notice: "Logged out. Switched to Sandbox mode."
  end

  private

  def load_expected_password
    return ENV["ADMIN_PASSWORD"] if ENV["ADMIN_PASSWORD"].present?
    return Rails.application.credentials.admin_password if Rails.application.credentials.try(:admin_password).present?

    # Direct fallback: parse .env in project root
    env_file = Rails.root.join(".env")
    if File.exist?(env_file)
      File.foreach(env_file) do |line|
        line = line.strip
        next if line.empty? || line.start_with?("#")
        k, v = line.split("=", 2)
        return v.strip.gsub(/\A["']|["']\z/, '') if k&.strip == "ADMIN_PASSWORD"
      end
    end
    nil
  end
end
