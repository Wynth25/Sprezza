class BeansController < ApplicationController
  before_action :set_bean, only: %i[ show edit update destroy ]
  before_action :require_admin!, only: %i[ create update destroy archive update_freeze sort ]

  # GET /beans or /beans.json
  def index
    if params[:archived] == 'true'
      @beans = Bean.where(archived: true).order(position: :asc, created_at: :desc)
    else
      @beans = Bean.where(archived: [false, nil]).order(position: :asc, created_at: :desc)
    end
  end

  # GET /beans/1 or /beans/1.json
  def show
  end

  # GET /beans/new
  def new
    @bean = Bean.new
  end

  # GET /beans/1/edit
  def edit
  end

  def create
    @bean = Bean.new(bean_params)

    respond_to do |format|
      if @bean.save
        format.html { redirect_to beans_path, notice: "Bean was successfully created." }
        format.json { render :show, status: :created, location: @bean }
      else
        format.html { render :new, status: :unprocessable_content }
        format.json { render json: @bean.errors, status: :unprocessable_content }
      end
    end
  end

  def update
    respond_to do |format|
      if @bean.update(bean_params)
        notice_message = if bean_params.key?(:frozen_on) || bean_params.key?(:freeze_date)
                           "Date saved"
                         elsif bean_params.key?(:archived)
                           @bean.archived ? "Bean archived" : "Bean restored"
                         else
                           "Bean saved"
                         end
        format.html { redirect_back fallback_location: beans_path, notice: notice_message, status: :see_other }
        format.json { render :show, status: :ok, location: @bean }
      else
        format.html { render :edit, status: :unprocessable_content }
        format.json { render json: @bean.errors, status: :unprocessable_content }
      end
    end
  end

  def archive
    @bean = Bean.find(params[:id])
    @bean.update(archived: true)
    redirect_to beans_path, notice: "Bean and its recipes were archived."
  end

  def archived
    @beans = Bean.where(archived: true).order(:position)
  end

  def update_freeze
    @bean = Bean.find(params[:id])
    @bean.update(frozen_on: params[:freeze_date], freeze_date: params[:freeze_date])
    redirect_to beans_path, notice: "Date saved"
  end

  def destroy
    @bean.destroy!

    respond_to do |format|
      format.html { redirect_to beans_path, notice: "Bean was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  def sort
    if params[:bean_ids].present?
      params[:bean_ids].each_with_index do |id, index|
        Bean.where(id: id).update_all(position: index + 1)
      end
    end
    head :ok
  end

  private

  def set_bean
    @bean = Bean.find(params[:id])
  end

  def bean_params
    params.require(:bean).permit(:name, :roastery, :roast_date, :description, :notes, :archived, :position, :frozen_on, :freeze_date)
  end
end
