class SettingsController < ApplicationController
  def show
    @dose_step_1 = Setting.get("dose_step_1", "0.5")
    @dose_step_2 = Setting.get("dose_step_2", "1.0")
    @grind_step_1 = Setting.get("grind_step_1", "0.1")
    @grind_step_2 = Setting.get("grind_step_2", "0.2")
  end

  def update
    if params[:device].present? && params[:cols].present?
      device = params[:device].to_s
      cols = params[:cols].to_s

      if %w[desktop mobile].include?(device) && %w[2 3].include?(cols)
        Setting.set("grid_#{device}", cols)
        return render json: { status: "ok", device: device, cols: cols }
      else
        return render json: { error: "Invalid setting" }, status: :unprocessable_entity
      end
    end

    # Handle dose & grind jumps
    dose_1_raw = params[:dose_step_1].presence || params[:dose_jump]
    dose_2_raw = params[:dose_step_2].presence || params[:dose_jump_2]
    grind_1_raw = params[:grind_step_1].presence || params[:grind_jump]
    grind_2_raw = params[:grind_step_2].presence || params[:grind_jump_2]

    if dose_1_raw.present? || dose_2_raw.present? || grind_1_raw.present? || grind_2_raw.present?
      if dose_1_raw.present?
        d1 = dose_1_raw.to_f.round(2)
        Setting.set("dose_step_1", d1.to_s) if d1 > 0
      end
      if dose_2_raw.present?
        d2 = dose_2_raw.to_f.round(2)
        Setting.set("dose_step_2", d2.to_s) if d2 > 0
      elsif dose_1_raw.present?
        d1 = dose_1_raw.to_f.round(2)
        Setting.set("dose_step_2", (d1 * 2).round(2).to_s) if d1 > 0
      end

      if grind_1_raw.present?
        g1 = grind_1_raw.to_f.round(2)
        Setting.set("grind_step_1", g1.to_s) if g1 > 0
      end
      if grind_2_raw.present?
        g2 = grind_2_raw.to_f.round(2)
        Setting.set("grind_step_2", g2.to_s) if g2 > 0
      elsif grind_1_raw.present?
        g1 = grind_1_raw.to_f.round(2)
        Setting.set("grind_step_2", (g1 * 2).round(2).to_s) if g1 > 0
      end

      respond_to do |format|
        format.html { redirect_to settings_path, notice: "Jump settings saved." }
        format.json { render json: { status: "ok", dose_step_1: Setting.get("dose_step_1"), dose_step_2: Setting.get("dose_step_2"), grind_step_1: Setting.get("grind_step_1"), grind_step_2: Setting.get("grind_step_2") } }
      end
    else
      respond_to do |format|
        format.html { redirect_to settings_path, alert: "No valid settings provided." }
        format.json { render json: { error: "Invalid setting" }, status: :unprocessable_entity }
      end
    end
  end
end
