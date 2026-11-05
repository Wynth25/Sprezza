class BrewsController < ApplicationController
  before_action :set_brew, only: %i[ show edit update destroy toggle_star ]

  # GET /brews or /brews.json
  def index
    @brews = Brew.all
  end

  # GET /brews/1 or /brews/1.json
  def show
  end

  # GET /recipes/:recipe_id/brews/new
  def new
    @recipe = Recipe.find_by(id: params[:recipe_id])
    @brew = @recipe ? @recipe.brews.build : Brew.new
  end

  # GET /brews/1/edit
  def edit
  end

  # POST /brews or /brews.json
  def create
    @brew = Brew.new(brew_params)

    respond_to do |format|
      if @brew.save
        format.html { redirect_to recipe_url(@brew.recipe), notice: "Brew was successfully created." }
        format.json { render :show, status: :created, location: @brew }
      else
        format.html { render :new, status: :unprocessable_content }
        format.json { render json: @brew.errors, status: :unprocessable_content }
      end
    end
  end

  # PATCH/PUT /brews/1 or /brews/1.json
  def update
    clean_params = brew_params.select { |k, _| @brew.has_attribute?(k) }
    if clean_params.key?(:star) && @brew.has_attribute?(:starred_at)
      is_star = ActiveModel::Type::Boolean.new.cast(clean_params[:star])
      clean_params[:starred_at] = is_star ? Time.current : nil
    end

    respond_to do |format|
      if @brew.update(clean_params)
        format.html { redirect_back fallback_location: root_path, notice: "Brew was successfully updated." }
        format.json { render json: { id: @brew.id, star: (@brew.has_attribute?(:star) ? @brew.star : true), starred_at: (@brew.respond_to?(:starred_at) ? @brew.starred_at : nil) }, status: :ok }
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
      format.html { redirect_to (@brew.recipe ? recipe_url(@brew.recipe) : root_path), notice: "Brew was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  # PATCH /brews/1/toggle_star
  def toggle_star
    new_star = params.key?(:star) ? ActiveModel::Type::Boolean.new.cast(params[:star]) : !@brew.star

    attrs = {}
    attrs[:star] = new_star if @brew.has_attribute?(:star)
    attrs[:starred_at] = (new_star ? Time.current : nil) if @brew.has_attribute?(:starred_at)

    @brew.update(attrs) if attrs.any?

    respond_to do |format|
      format.json { render json: { id: @brew.id, star: (@brew.has_attribute?(:star) ? @brew.star : new_star), starred_at: (@brew.respond_to?(:starred_at) ? @brew.starred_at : nil) } }
      format.html { redirect_back fallback_location: root_path }
    end
  end

  private

  def set_brew
    @brew = Brew.find(params[:id])
  end

  def brew_params
    params.require(:brew).permit(:recipe_id, :dose, :grind, :star, :starred_at, :notes)
  end
end
