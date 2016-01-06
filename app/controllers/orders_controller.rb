require 'active_support'

class OrdersController < ApplicationController
  before_action :authenticate_user!, except: [:create, :new]
  before_action :find_personal_order

  def new
    @order = Order.new cart_entries: @cart.cart_entries if  @cart.count > 0
    redirect_to store_path unless @order || @personal_order
  end

  def create
    @order = Order.new
    @order.cart_entries << @cart.cart_entries
    @order.personal_order = @personal_order

    begin
      if user_signed_in?
        @user = current_user
        @new_user = false
        @user.user_data.update user_params
      else
        @password = Devise.friendly_token 8
        @user = save_user!
        sign_in :user, @user
        @new_user = true
        @user_data = UserData.create! user_params
        @user_data.user = @user
        @user_data.save!
      end

      @order.user_data = @user_data
      @order.save!

      session[:personalOrder] = nil
      session[:user_data_id] =  @user_data.id
      session[:user_email] = params[:email]
      @cart.clear
      #NotificationMailer.order_created_notification(@order).deliver_now
    rescue Exception => e
      flash[:title] = 'Could not create order!'
      flash[:alert] = e.message
      logger.fatal 'Could not create order!'
      logger.fatal e.message
      logger.fatal e.backtrace.inspect
      render action: 'new'
    end
  end

  def index
    redirect_to profile_path unless admin_signed_in?
    @orders = Order.all
  end

  def show
    @order = Order.find(params[:id])
  end

  def destroy
    Order.find(params[:id]).destroy
    redirect_to controller: :orders,  action: :index
  end

  private
  def user_params
    params.require(:user_data).permit(:name, :surname, :fname, :phone, :skype, :vk, :country, :city, :address, :index, :about)
  end

  def save_user!
    User.create! email: params[:email], password: @password, password_confirmation: @password
  end

  def find_personal_order
    @personal_order = PersonalOrder.find_by_id session[:personalOrder] if session.include? :personalOrder
  end
end
