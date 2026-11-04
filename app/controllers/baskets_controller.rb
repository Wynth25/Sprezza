class BasketsController < ApplicationController
  before_action :set_basket, only: %i[ show edit update destroy ]
  before_action :require_admin!, only: %i[ create update destroy sort ]

  # GET /baskets or /baskets.json
  def index
    @baskets = Basket.order(position: :asc, created_at: :asc)
  end

  # GET /baskets/1 or /baskets/1.json
  def show
  end

  # GET /baskets/new
  def new
    @basket = Basket.new(min_dose: 16.0, max_dose: 18.0)
  end

  # GET /baskets/1/edit
  def edit
    @basket.min_dose ||= 16.0
    @basket.max_dose ||= 18.0
  end

  # POST /baskets or /baskets.json
  def create
    @basket = Basket.new(basket_params)

    respond_to do |format|
      if @basket.save
        format.html { redirect_to baskets_path, notice: "Basket was successfully created." }
        format.json { render :show, status: :created, location: @basket }
      else
        format.html { render :new, status: :unprocessable_content }
        format.json { render json: @basket.errors, status: :unprocessable_content }
      end
    end
  end

  # PATCH/PUT /baskets/1 or /baskets/1.json
  def update
    respond_to do |format|
      if @basket.update(basket_params)
        format.html { redirect_to baskets_path, notice: "Basket was successfully updated.", status: :see_other }
        format.json { render :show, status: :ok, location: @basket }
      else
        format.html { render :edit, status: :unprocessable_content }
        format.json { render json: @basket.errors, status: :unprocessable_content }
      end
    end
  end

  # DELETE /baskets/1 or /baskets/1.json
  def destroy
    @basket.destroy!

    respond_to do |format|
      format.html { redirect_to baskets_path, notice: "Basket was successfully destroyed.", status: :see_other }
      format.json { head :no_content }
    end
  end

  def sort
    if params[:basket_ids].present?
      params[:basket_ids].each_with_index do |id, index|
        Basket.where(id: id).update_all(position: index + 1)
      end
    end
    head :ok
  end

  private

  def set_basket
    @basket = Basket.find(params[:id])
  end

  def basket_params
    params.require(:basket).permit(:name, :min_dose, :max_dose, :position)
  end
end
