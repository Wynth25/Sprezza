class ApplicationController < ActionController::Base
  around_action :switch_database

  private

  def admin_logged_in?
    session[:admin_id] == "admin_authorized" || cookies.encrypted[:admin_auth] == "admin_authorized"
  end
  helper_method :admin_logged_in?

  def switch_database(&block)
    if Rails.env.test?
      yield
    else
      role = admin_logged_in? ? :writing : :sandbox
      ActiveRecord::Base.connected_to(role: role, &block)
    end
  end

  def require_admin!
    unless admin_logged_in?
      respond_to do |format|
        format.html { redirect_to root_path, alert: "Modifications are saved to your browser in Sandbox mode." }
        format.json { render json: { error: "Sandbox mode is client-side only" }, status: :forbidden }
      end
    end
  end
end
