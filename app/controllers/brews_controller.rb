class BrewsController < ApplicationController
  before_action :set_brew, only: %i[ show edit update destroy toggle_star ]
  before_action :require_admin!, only: %i[ create update destroy toggle_star ]

  # GET /brews or /brews.json
  def index
    @brews = Brew.all
  end

  # GET /brews/1 or /brews/1.json
  def show
  end

  # GET /brews/new
  def new
    @brew = Brew.new
  end

  # GET /brews/1/edit
  def edit
  end

  # POST /brews or /brews.json
  def create
    @brew = Brew.new(brew_params)

    respond_to do |format|
      if @brew.save
        format.html { redirect_to @brew, notice: "Brew was successfully created." }
        format.json { render :show, status: :created, location: @brew }
      else
        format.html { render :new, status: :unprocessable_content }
        format.json { render json: @brew.errors, status: :unprocessable_content }
      end
    end
  end

  # PATCH/PUT /brews/1 or /brews/1.json
  def update
    respond_to do |format|
      if @brew.update(brew_params)
        format.html { redirect_to @brew, notice: "Brew was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @brew }
      else
        format.html { render :edit, status: :unprocessable_content }
        format.json { render json: @brew.errors, status: :unprocessable_content }
      end
    end
  end

  # DELETE /brews/1 or /brews/1.json
  def destroy
    @brew.destroy!

    respond_to do |format|
      format.html { redirect_to brews_path, notice: "Brew was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  # PATCH /brews/1/toggle_star
  def toggle_star
    new_star = params.key?(:star) ? ActiveModel::Type::Boolean.new.cast(params[:star]) : !@brew.star

    if @brew.has_attribute?(:star)
      @brew.update(star: new_star)
    end

    respond_to do |format|
      format.json { render json: { id: @brew.id, star: (@brew.has_attribute?(:star) ? @brew.star : new_star) } }
      format.html { redirect_back fallback_location: root_path }
    end
  end

  private

  def set_brew
    @brew = Brew.find(params[:id])
  end

  def brew_params
    params.require(:brew).permit(:recipe_id, :dose, :grind, :star, :notes)
  end
end
